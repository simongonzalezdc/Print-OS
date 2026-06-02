import os
import struct
import tempfile
import pytest
from caedoapi.utils.stl_utils import calculate_stl_volume

def create_binary_stl(triangles):
    # Header (80 bytes) + Triangle count (4 bytes) + Triangles (50 bytes each)
    data = bytearray(80) + struct.pack('<I', len(triangles))
    for t in triangles:
        # Normal (12 bytes) + 3 Vertices (36 bytes) + Attribute (2 bytes)
        data += struct.pack('<fff', 0, 0, 1) # Normal
        data += struct.pack('<fff', *t[0])   # V1
        data += struct.pack('<fff', *t[1])   # V2
        data += struct.pack('<fff', *t[2])   # V3
        data += struct.pack('<H', 0)         # Attr
    return data

def create_ascii_stl(triangles):
    stl = "solid test\n"
    for t in triangles:
        stl += "  facet normal 0 0 1\n    outer loop\n"
        stl += f"      vertex {t[0][0]} {t[0][1]} {t[0][2]}\n"
        stl += f"      vertex {t[1][0]} {t[1][1]} {t[1][2]}\n"
        stl += f"      vertex {t[2][0]} {t[2][1]} {t[2][2]}\n"
        stl += "    endloop\n  endfacet\n"
    stl += "endsolid test\n"
    return stl.encode('utf-8')

def test_binary_stl_volume():
    # Simple tetrahedron with volume 1/6 * |p1.(p2 x p3)|
    # Vertices (1,0,0), (0,1,0), (0,0,1) with origin (0,0,0) forming the tetrahedron
    # This triangle forms a tetrahedron with the origin that has volume 1/6.
    triangles = [
        ((1,0,0), (0,1,0), (0,0,1))
    ]
    data = create_binary_stl(triangles)
    
    with tempfile.NamedTemporaryFile(suffix='.stl', delete=False) as f:
        f.write(data)
        path = f.name
    
    try:
        vol = calculate_stl_volume(path)
        assert abs(vol - 1/6.0) < 1e-6
    finally:
        os.unlink(path)

def test_ascii_stl_volume():
    triangles = [
        ((1,0,0), (0,1,0), (0,0,1))
    ]
    data = create_ascii_stl(triangles)
    
    with tempfile.NamedTemporaryFile(suffix='.stl', delete=False) as f:
        f.write(data)
        path = f.name
    
    try:
        vol = calculate_stl_volume(path)
        assert abs(vol - 1/6.0) < 1e-6
    finally:
        os.unlink(path)
