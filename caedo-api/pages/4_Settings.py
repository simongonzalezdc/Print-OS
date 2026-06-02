import streamlit as st
import json
from caedoapi.repositories.printers_repo import PrinterRepository
from caedoapi.repositories.costs_repo import CostsRepository
from caedoapi.ui.styles import apply_custom_styles

st.set_page_config(page_title="Settings — Caedo API", page_icon="⚙️", layout="wide")
apply_custom_styles()

st.title("FARM_CONFIGURATION")

tab1, tab2, tab3 = st.tabs(["[HARDWARE_FLEET]", "[COST_VARIABLES]", "[SYSTEM_DATA]"])

# ... (tab1 and tab2 code remains same) ...

with tab3:
    st.header("DATA_INTEGRITY")
    
    st.subheader("VOICEFORGE_HANDOFF_CACHE")
    from caedoapi.utils.handoff_scanner import SHARED_DIR, get_recent_handoffs
    handoffs = get_recent_handoffs()
    
    if handoffs:
        st.write(f"Active Handoffs: {len(handoffs)}")
        if st.button("Purge Handoff Archive"):
            try:
                import os
                import shutil
                if os.path.exists(SHARED_DIR):
                    for filename in os.listdir(SHARED_DIR):
                        file_path = os.path.join(SHARED_DIR, filename)
                        if os.path.isfile(file_path) or os.path.islink(file_path):
                            os.unlink(file_path)
                        elif os.path.isdir(file_path):
                            shutil.rmtree(file_path)
                    st.success("Handoff archive purged successfully.")
                    st.rerun()
            except Exception as e:
                st.error(f"Purge failed: {e}")
    else:
        st.info("Handoff archive is empty.")

    st.markdown("---")
    st.subheader("SESSION_TELEMETRY")
    if st.button("Reset Session State"):
        st.session_state.clear()
        st.rerun()

with tab1:
# ...rest of the code...
    st.header("PRINTER_MANAGEMENT")
    
    # 1. Add/Edit Printer Form
    with st.expander("[+] CONFIGURE_NEW_UNIT", expanded=False):
        if 'editing_printer' not in st.session_state:
            st.session_state.editing_printer = None
        
        edit_data = st.session_state.editing_printer or {}
        
        with st.form("printer_form"):
            name = st.text_input("UNIT_NAME", value=edit_data.get('name', ''))
            c1, c2, c3 = st.columns(3)
            with c1: x = st.number_input("BUILD_X", min_value=1, value=edit_data.get('build_x_mm', 220))
            with c2: y = st.number_input("BUILD_Y", min_value=1, value=edit_data.get('build_y_mm', 220))
            with c3: z = st.number_input("BUILD_Z", min_value=1, value=edit_data.get('build_z_mm', 250))
            
            materials = st.multiselect(
                "SUPPORTED_MAT", 
                ["PLA", "PETG", "TPU"],
                default=[m for m in json.loads(edit_data.get('supports_materials_json', '["PLA"]')) if m in ["PLA", "PETG", "TPU"]]
            )
            
            multicolor = st.checkbox("MULTICOLOR_MODULE", value=bool(edit_data.get('multicolor_enabled', 0)))
            max_colors = st.number_input("MAX_CHANNELS", min_value=1, value=edit_data.get('max_colors', 4) if multicolor else 1)
            
            speed = st.selectbox("SPEED_TIER", ["slow", "normal", "fast"], index=["slow", "normal", "fast"].index(edit_data.get('speed_tier', 'normal')))
            rel = st.slider("RELIABILITY_SCORE", 0.0, 1.0, value=float(edit_data.get('reliability_score', 0.9)))
            notes = st.text_area("UNIT_NOTES")
            
            if st.form_submit_button("COMMIT_HARDWARE_SPEC"):
                new = {
                    'name': name, 'build_x_mm': x, 'build_y_mm': y, 'build_z_mm': z,
                    'supports_materials_json': materials, 'multicolor_enabled': multicolor,
                    'max_colors': max_colors if multicolor else None, 'speed_tier': speed,
                    'reliability_score': rel, 'notes': notes
                }
                if st.session_state.editing_printer:
                    PrinterRepository.update(st.session_state.editing_printer['id'], new)
                    st.session_state.editing_printer = None
                else:
                    PrinterRepository.create(new)
                st.rerun()

    # 2. List
    st.subheader("ACTIVE_UNITS")
    printers = PrinterRepository.get_all()
    if printers:
        for p in printers:
            with st.container(border=True):
                c1, c2, c3 = st.columns([4, 1, 1])
                with c1:
                    st.markdown(f"**{p['name']}**")
                    st.caption(f"{p['build_x_mm']}x{p['build_y_mm']}x{p['build_z_mm']} | {p['speed_tier'].upper()} | REL: {p['reliability_score']}")
                with c2:
                    if st.button("MODIFY", key=f"ed_{p['id']}"):
                        st.session_state.editing_printer = p
                        st.rerun()
                with c3:
                    if st.button("DELETE", key=f"dl_{p['id']}"):
                        PrinterRepository.delete(p['id'])
                        st.rerun()

with tab2:
    st.header("GLOBAL_CONSTANTS")
    costs = CostsRepository.get_all()
    
    with st.form("costs_form"):
        st.markdown("### FILAMENT_PRICING ($/kg)")
        allowed = ["PLA", "PETG", "TPU"]
        new_f_costs = {}
        disp_costs = {m: costs.get(m, 20.0) for m in allowed}
        cols = st.columns(3)
        for i, (m, v) in enumerate(disp_costs.items()):
            with cols[i]: new_f_costs[m] = st.number_input(f"{m}", value=float(v), step=0.1)
        
        st.markdown("### OPERATIONAL_OVERHEAD")
        elec = st.number_input("ENERGY_COST ($/kWh)", value=float(costs.get('electricity_usd_per_kwh', 0.12)), format="%.4f")
        pwr = st.number_input("AVG_POWER (kWh/h)", value=float(costs.get('printer_kwh_per_hour', 0.15)))
        labor = st.number_input("LABOR_RATE ($/h)", value=float(costs.get('labor_usd_per_hour', 0.0)))
        dep = st.number_input("DEPRECIATION ($/h)", value=float(costs.get('depreciation_usd_per_hour', 0.10)))
        
        st.markdown("### MARKETPLACE_STRUCTURE")
        p_fee = st.number_input("PLATFORM_FEE (%)", value=float(costs.get('platform_fee_pct', 0.13)))
        pack = st.number_input("PACKAGING_FIXED ($)", value=float(costs.get('packaging_usd_per_order', 1.50)))
        
        if st.form_submit_button("SAVE_GLOBAL_CONSTANTS"):
            CostsRepository.set('filament_usd_per_kg', new_f_costs, 'json')
            CostsRepository.set('electricity_usd_per_kwh', elec, 'number')
            CostsRepository.set('printer_kwh_per_hour', pwr, 'number')
            CostsRepository.set('labor_usd_per_hour', labor, 'number')
            CostsRepository.set('depreciation_usd_per_hour', dep, 'number')
            CostsRepository.set('platform_fee_pct', p_fee, 'number')
            CostsRepository.set('packaging_usd_per_order', pack, 'number')
            st.rerun()
