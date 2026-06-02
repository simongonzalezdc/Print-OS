import streamlit as st

from caedoapi.db import init_db
from caedoapi.ui.styles import apply_custom_styles

st.set_page_config(
    page_title="Caedo API",
    page_icon="🖨️",
    layout="wide"
)

# Apply Custom Theme
apply_custom_styles()

# Initialize database
init_db()

def main():
    st.sidebar.title("Caedo API")
    st.sidebar.markdown("---")
    
    st.title("Welcome to Caedo API")
    st.write("### Today's Status")
    
    # Check for handoffs from Caedo
    from caedoapi.utils.handoff_scanner import get_recent_handoffs
    handoffs = get_recent_handoffs()
    
    if handoffs:
        with st.expander(f"✨ New Handoffs from Caedo ({len(handoffs)})", expanded=True):
            for h in handoffs:
                cols = st.columns([3, 1])
                with cols[0]:
                    st.write(f"**{h['filename']}**")
                    meta = h.get('metadata', {})
                    if 'objects' in meta:
                        st.caption(", ".join([obj['name'] for obj in meta['objects']]))
                with cols[1]:
                    if st.button("Develop Business Case", key=h['filename']):
                        # 1. Prepare data for Business Page
                        objs = meta.get('objects', [])
                        summary = objs[0].get('summary', '') if objs else "3D Printed Part"
                        
                        # 2. Get physical estimate
                        from caedoapi.utils.stl_utils import calculate_stl_volume, estimate_grams
                        vol = calculate_stl_volume(h['stl_path'])
                        grams = estimate_grams(vol)
                        
                        # 3. Store in session state
                        st.session_state.handoff_eval = {
                            "idea": summary,
                            "physical_grams": grams,
                            "metadata": meta
                        }
                        
                        # 4. Success message and instruction
                        st.success("Design data synchronized! Proceeding to Business Intelligence...")
                        st.switch_page("pages/3_Business.py")
    
    st.info("Navigate through the sidebar to manage your jobs, printers, and business ideas.")

if __name__ == "__main__":
    main()
