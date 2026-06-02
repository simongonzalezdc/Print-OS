import streamlit as st
import pandas as pd
from datetime import datetime
from caedoapi.repositories.jobs_repo import JobsRepository
from caedoapi.repositories.printers_repo import PrinterRepository
from caedoapi.ui.styles import apply_custom_styles

st.set_page_config(page_title="Home — Caedo API", page_icon="🏠", layout="wide")
apply_custom_styles()

st.title("OPERATIONS_DASHBOARD")

# 1. Fetch Data
jobs = JobsRepository.get_all()
printers = PrinterRepository.get_all()

if not jobs and not printers:
    st.info("SYSTEM_READY: Initializing... Add hardware units in SETTINGS to begin.")
    if st.button("CONFIGURE_FARM"):
        st.switch_page("pages/4_Settings.py")
else:
    # 2. KPI Section
    st.subheader("SYSTEM_STATUS_TELEMETRY")
    c1, c2, c3, c4 = st.columns(4)
    
    queued = [j for j in jobs if j['status'] == 'queued']
    printing = [j for j in jobs if j['status'] == 'printing']
    
    # Filter for today's completed
    today = datetime.now().date().isoformat()
    completed_today = [j for j in jobs if j['status'] == 'completed' and (j['finished_at'] or "").startswith(today)]
    
    with c1: st.metric("QUEUED_TASKS", len(queued))
    with c2: st.metric("ACTIVE_PROCS", len(printing))
    with c3: st.metric("YIELD_24H", len(completed_today))
    with c4: st.metric("UNITS_ONLINE", len(printers))

    st.markdown("---")

    # 3. Main Dashboard Rows
    row1_c1, row1_c2 = st.columns([2, 1])
    
    with row1_c1:
        st.subheader("CRITICAL_TASKS")
        urgent = [j for j in jobs if j['status'] == 'queued' and j['priority'] == 'urgent']
        if urgent:
            for j in urgent[:3]:
                # Custom Warning Block
                st.error(f"PRIORITY_ALERT: {j['name']} (MAT: {j['material']})")
                if st.button(f"DEPLOY_JOB_{j['id']}", key=f"home_{j['id']}"):
                    st.switch_page("pages/2_Facility.py")
        else:
            st.success("STABLE_FLOW: No critical tasks pending.")

    with row1_c2:
        st.subheader("PROACTIVE_RISK_MONITOR")
        if not queued:
            st.success("NO_PENDING_RISKS")
        else:
            if st.button("EXECUTE_FLEET_DIAGNOSTICS"):
                with st.spinner("AI_DIAGNOSING_QUEUE..."):
                    ai = AIClient()
                    risk_summary = []
                    for job in queued[:5]: # Cap at 5 for performance
                        risk = ai.predict_failure(job)
                        risk_summary.append({
                            "Job": job['name'],
                            "Risk": risk.risk_level,
                            "Score": f"{risk.risk_score}%"
                        })
                    st.session_state.home_risks = risk_summary
            
            if 'home_risks' in st.session_state:
                for r in st.session_state.home_risks:
                    color = "#00FFCC" if r['Risk'] == "Low" else "#FFAA00" if r['Risk'] == "Medium" else "#FF0055"
                    st.markdown(f"- **{r['Job']}**: <span style='color:{color}'>{r['Risk']}</span> ({r['Score']})", unsafe_allow_html=True)
                if st.button("CLEAR_DIAGNOSTICS"):
                    del st.session_state.home_risks
                    st.rerun()

        st.markdown("---")
        st.subheader("HARDWARE_STATUS")
        if not printers:
            st.info("NO_UNITS_LOADED")
        else:
            p_df = pd.DataFrame(printers)
            # Find which printers are busy
            busy_printer_ids = [j['assigned_printer_id'] for j in printing]
            p_df['ST'] = p_df['id'].apply(lambda x: "READY" if x not in busy_printer_ids else "BUSY")
            st.dataframe(p_df[['name', 'ST']], hide_index=True, use_container_width=True)

    # 4. Quick Actions
    st.markdown("---")
    st.subheader("CONTROL_PANEL_LINKS")
    qa1, qa2, qa3 = st.columns(3)
    with qa1:
        if st.button("OPEN_FACILITY", use_container_width=True): st.switch_page("pages/2_Facility.py")
    with qa2:
        if st.button("ANALYTICS_DASH", use_container_width=True): st.switch_page("pages/5_Reports.py")
    with qa3:
        if st.button("HARDWARE_CONFIG", use_container_width=True): st.switch_page("pages/4_Settings.py")
