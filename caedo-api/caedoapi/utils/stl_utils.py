import struct
import zipfile
import xml.etree.ElementTree as ET
import os

def get_3mf_stats(file_path):
    """
    Get bounding box of a 3MF file by parsing its model XML.
    Volume estimation for 3MF is complex and not fully implemented here.
    """
    try:
        with zipfile.ZipFile(file_path, 'r') as z:
            # 3MF model is typically at /3D/3dmodel.model
            model_content = None
            for name in z.namelist():
                if name.lower().endswith('.model'):
                    model_content = z.read(name)
                    break
            
            if not model_content:
                return {"volume": 0, "bbox": {"min": [0,0,0], "max": [0,0,0], "size": [0,0,0]}}

            root = ET.fromstring(model_content)
            # Namespace handling for 3MF
            ns = {'ns': 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
            
            min_coords = [float('inf')] * 3
            max_coords = [float('-inf')] * 3
            
            # Simple heuristic: parse all vertices in the model
            for vertex in root.findall('.//ns:vertex', ns):
                x = float(vertex.get('x', 0))
                y = float(vertex.get('y', 0))
                z = float(vertex.get('z', 0))
                v = [x, y, z]
                for i in range(3):
                    if v[i] < min_coords[i]: min_coords[i] = v[i]
                    if v[i] > max_coords[i]: max_coords[i] = v[i]
            
            if min_coords[0] == float('inf'):
                return {"volume": 0, "bbox": {"min": [0,0,0], "max": [0,0,0], "size": [0,0,0]}}

            return {
                "volume": 0, # Volume estimation from raw 3MF XML is non-trivial
                "bbox": {
                    "min": min_coords,
                    "max": max_coords,
                    "size": [max_coords[i] - min_coords[i] for i in range(3)]
                }
            }
    except Exception as e:
        import logging
        logging.error(f"Failed to get 3MF stats for {file_path}: {e}")
        return {"volume": 0, "bbox": {"min": [0,0,0], "max": [0,0,0], "size": [0,0,0]}}

def get_stl_stats(file_path):
    """
    Get volume and bounding box of a binary STL file.
    """
    try:
        with open(file_path, 'rb') as f:
            header = f.read(80)
            if header.startswith(b'solid'):
                # Try ASCII parsing
                f.seek(0)
                return _get_ascii_stl_stats(f)
            
            # Binary STL
            count_data = f.read(4)
            if len(count_data) < 4:
                return {"volume": 0, "bbox": {"min": [0,0,0], "max": [0,0,0]}}
            count = struct.unpack('<I', count_data)[0]
            
            volume = 0.0
            min_coords = [float('inf')] * 3
            max_coords = [float('-inf')] * 3
            
            for _ in range(count):
                data = f.read(50)
                if len(data) < 50:
                    break
                
                # vertices: 3 floats each starting after the normal (12 bytes)
                v1 = struct.unpack('<fff', data[12:24])
                v2 = struct.unpack('<fff', data[24:36])
                v3 = struct.unpack('<fff', data[36:48])
                
                # Volume
                volume += (v1[0] * (v2[1] * v3[2] - v2[2] * v3[1]) +
                           v1[1] * (v2[2] * v3[0] - v2[0] * v3[2]) +
                           v1[2] * (v2[0] * v3[1] - v2[1] * v3[0]))
                
                # Bounding Box
                for v in [v1, v2, v3]:
                    for i in range(3):
                        if v[i] < min_coords[i]: min_coords[i] = v[i]
                        if v[i] > max_coords[i]: max_coords[i] = v[i]
            
            return {
                "volume": abs(volume) / 6.0,
                "bbox": {
                    "min": min_coords if min_coords[0] != float('inf') else [0,0,0],
                    "max": max_coords if max_coords[0] != float('-inf') else [0,0,0],
                    "size": [max_coords[i] - min_coords[i] for i in range(3)] if min_coords[0] != float('inf') else [0,0,0]
                }
            }
    except Exception as e:
        import logging
        logging.error(f"Failed to get STL stats for {file_path}: {e}")
        return {"volume": 0, "bbox": {"min": [0,0,0], "max": [0,0,0], "size": [0,0,0]}}

def _get_ascii_stl_stats(f):
    volume = 0.0
    min_coords = [float('inf')] * 3
    max_coords = [float('-inf')] * 3
    lines = f.readlines()
    vertices = []
    for line in lines:
        line = line.decode('utf-8', errors='ignore').strip().lower()
        if line.startswith('vertex'):
            parts = line.split()
            if len(parts) >= 4:
                v = [float(parts[1]), float(parts[2]), float(parts[3])]
                vertices.append(v)
                for i in range(3):
                    if v[i] < min_coords[i]: min_coords[i] = v[i]
                    if v[i] > max_coords[i]: max_coords[i] = v[i]
            
            if len(vertices) == 3:
                v1, v2, v3 = vertices
                volume += (v1[0] * (v2[1] * v3[2] - v2[2] * v3[1]) +
                           v1[1] * (v2[2] * v3[0] - v2[0] * v3[2]) +
                           v1[2] * (v2[0] * v3[1] - v2[1] * v3[0]))
                vertices = []
                
    return {
        "volume": abs(volume) / 6.0,
        "bbox": {
            "min": min_coords if min_coords[0] != float('inf') else [0,0,0],
            "max": max_coords if max_coords[0] != float('-inf') else [0,0,0],
            "size": [max_coords[i] - min_coords[i] for i in range(3)] if min_coords[0] != float('inf') else [0,0,0]
        }
    }

def estimate_grams(volume_mm3, material="PLA"):
    """
    Estimate grams from volume based on material density.
    """
    densities = {
        "PLA": 1.24,
        "PETG": 1.27,
        "TPU": 1.21,
        "ABS": 1.04,
        "ASA": 1.07
    }
    density = densities.get(material.upper(), 1.24)
    # volume in cm3 = mm3 / 1000
    # weight = volume_cm3 * density
    return (volume_mm3 / 1000.0) * density

def calculate_stl_volume(file_path):
    """
    Return the STL volume in cubic millimeters.
    """
    return get_stl_stats(file_path)["volume"]
