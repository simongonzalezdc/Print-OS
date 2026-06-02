import streamlit as st
from datetime import datetime
from caedoapi.repositories.jobs_repo import JobsRepository
from caedoapi.repositories.printers_repo import PrinterRepository
from caedoapi.repositories.events_repo import EventsRepository
from caedoapi.domain.routing import RoutingEngine
from caedoapi.domain.states import validate_transition, ALLOWED_TRANSITIONS
from caedoapi.ui.styles import apply_custom_styles
from caedoapi.ai.client import AIClient

ai = AIClient()

st.set_page_config(page_title="Facility — Caedo API", page_icon="🏭", layout="wide")
apply_custom_styles()

st.title("FACILITY_CONTROL")

tab1, tab2, tab3 = st.tabs(["[+ NEW_JOB]", "[Active_Queue]", "[History_Log]"])

with tab1:
    st.header("JOB_INTAKE")
    
    col_a, col_b = st.columns([1, 1], gap="large")
    
    with col_a:
        with st.form("add_job_form", clear_on_submit=False):
            name = st.text_input("JOB_IDENTIFIER")
            source = st.selectbox("ORIGIN_SOURCE", ["personal", "etsy", "friend", "other"])
            
            st.markdown("### DIMENSIONS_SPEC")
            c1, c2, c3 = st.columns(3)
            with c1: width = st.number_input("W (mm)", min_value=1, value=50)
            with c2: depth = st.number_input("D (mm)", min_value=1, value=50)
            with c3: height = st.number_input("H (mm)", min_value=1, value=50)
            
            material = st.selectbox("MATERIAL_TYPE", ["PLA", "PETG", "TPU"])
            color_count = st.number_input("COLOR_CHANNELS", min_value=1, value=1)
            
            st.markdown("### RESOURCE_EST")
            c4, c5 = st.columns(2)
            with c4: grams = st.number_input("GRAMS", min_value=0.0, value=20.0)
            with c5: minutes = st.number_input("MINUTES", min_value=1, value=60)
            
            priority = st.select_slider("PRIORITY_LEVEL", options=["low", "normal", "urgent"], value="normal")
            due_date = st.date_input("DEADLINE", value=None)
            
            notes = st.text_area("NOTES_LOG")
            
            submit = st.form_submit_button("CALCULATE_ROUTING")

    with col_b:
        if submit:
            if not name:
                st.error("MISSINING_IDENTIFIER: Name required.")
            else:
                job_spec = {
                    'width_mm': width, 'depth_mm': depth, 'height_mm': height,
                    'material': material, 'color_count': color_count, 'priority': priority
                }
                printers = PrinterRepository.get_all()
                if not printers:
                    st.warning("HARDWARE_NOT_FOUND: Configure printers in SETTINGS.")
                else:
                    rec = RoutingEngine.get_recommendation(job_spec, printers)
                    st.session_state.current_recommendation = rec
                    st.session_state.current_job_payload = {
                        'name': name, 'source': source,
                        'width_mm': width, 'depth_mm': depth, 'height_mm': height,
                        'material': material, 'color_count': color_count,
                        'grams_estimated': grams, 'minutes_estimated': minutes,
                        'priority': priority, 'due_at': due_date.isoformat() if due_date else None,
                        'notes': notes
                    }

        if 'current_recommendation' in st.session_state:
            rec = st.session_state.current_recommendation
            if rec['success']:
                st.success(f"ROUTING_SUCCESS: {rec['explanation']}")
                with st.expander("SCORING_METRICS"):
                    st.json(rec['full_breakdown'])
                
                if st.button("AUTHORIZE_JOB_CREATION"):
                    payload = st.session_state.current_job_payload
                    payload['recommended_printer_id'] = rec['recommended_printer_id']
                    payload['recommended_reason_json'] = rec
                    job_id = JobsRepository.create(payload)
                    EventsRepository.log_event(job_id, "job_created", {"recommended_printer": rec['recommended_printer_name']})
                    st.success(f"JOB_QUEUED: ID {job_id}")
                    del st.session_state.current_recommendation
                    st.rerun()
            else:
                st.error(f"ROUTING_FAILED: {rec['explanation']}")

        # Failure Prediction Section
        if 'current_recommendation' in st.session_state and st.session_state.current_recommendation['success']:
            st.markdown("---")
            st.subheader("PROACTIVE_RISK_ANALYSIS")
            
            p_id = st.session_state.current_recommendation['recommended_printer_id']
            # Fetch last 5 events for this printer for context
            history = EventsRepository.get_all() # Logic to filter by printer would be better but get_all is available
            p_history = [e for e in history if e.get('data', {}).get('printer_id') == p_id or e.get('data', {}).get('printer') == st.session_state.current_recommendation['recommended_printer_name']][-5:]
            
            if st.button("RUN_FAILURE_SIMULATION"):
                with st.spinner("ANALYZING_TELEMETRY..."):
                    risk = ai.predict_failure(st.session_state.current_job_payload, p_history)
                    st.session_state.current_risk = risk
            
            if 'current_risk' in st.session_state:
                risk = st.session_state.current_risk
                # Color code risk
                color = "#00FFCC" if risk.risk_level == "Low" else "#FFAA00" if risk.risk_level == "Medium" else "#FF0055"
                
                with st.container(border=True):
                    st.markdown(f"### RISK_LEVEL: <span style='color:{color}'>{risk.risk_level.upper()}</span> ({risk.risk_score}%)", unsafe_allow_html=True)
                    st.write(risk.explanation)
                    
                    c1, c2 = st.columns(2)
                    with c1:
                        st.markdown("**CRITICAL_FACTORS**")
                        for f in risk.top_factors: st.markdown(f"- {f}")
                    with c2:
                        st.markdown("**MITIGATION_PROTOCOL**")
                        for m in risk.mitigation_steps: st.markdown(f"- {m}")

with tab2:
    st.header("ACTIVE_DEPLOYMENTS")
    active_jobs = [j for j in JobsRepository.get_all() if j['status'] not in ['completed', 'failed', 'canceled']]
    
    if not active_jobs:
        st.info("NO_ACTIVE_TASKS")
    else:
        # Optimization Trigger
        queued_only = [j for j in active_jobs if j['status'] == 'queued']
        if queued_only:
            if st.button("EXECUTE_SCHEDULE_OPTIMIZATION"):
                with st.spinner("CALCULATING_LOGISTICS_STRATEGY..."):
                    printers = PrinterRepository.get_all()
                    optimization = ai.optimize_queue(queued_only, printers)
                    st.session_state.current_optimization = optimization
            
            if 'current_optimization' in st.session_state:
                opt = st.session_state.current_optimization
                with st.container(border=True):
                    st.markdown("### AI_LOGISTICS_STRATEGY")
                    st.write(opt.get('strategy', 'No strategy provided.'))
                    if 'new_sequence' in opt:
                        st.json(opt['new_sequence'])
                    if st.button("DISMISS_OPTIMIZATION"):
                        del st.session_state.current_optimization
                        st.rerun()

        st.markdown("---")
        for job in active_jobs:
            # Custom "Ticket" style card
            with st.container(border=True):
                c1, c2, c3 = st.columns([2, 2, 1])
                with c1:
                    st.markdown(f"**{job['name']}**")
                    st.caption(f"MAT: {job['material']} | PRI: {job['priority']}")
                    st.caption(f"REC_HARDWARE: {job['recommended_printer_name']}")
                
                with c2:
                    st.markdown(f"STATUS: `{job['status'].upper()}`")
                    if job['assigned_printer_name']:
                        st.markdown(f"ASSIGNED: **{job['assigned_printer_name']}**")
                    else:
                        printers = PrinterRepository.get_all()
                        p_names = {p['name']: p['id'] for p in printers}
                        sel = st.selectbox("ASSIGN_PRINTER", options=[""] + list(p_names.keys()), key=f"sel_{job['id']}")
                        if sel:
                            JobsRepository.assign_printer(job['id'], p_names[sel])
                            EventsRepository.log_event(job['id'], "printer_assigned", {"printer": sel})
                            st.rerun()
                
                with c3:
                    if job['status'] == 'queued' and job['assigned_printer_id']:
                        if st.button("START_EXE", key=f"start_{job['id']}"):
                            JobsRepository.update_status(job['id'], 'printing')
                            st.rerun()
                    
                    if job['status'] == 'printing':
                        if st.button("COMPLETE", key=f"comp_{job['id']}"):
                            st.session_state.completing_job = job
                        if st.button("ABORT_FAIL", key=f"fail_{job['id']}"):
                            st.session_state.failing_job = job
                    
                    if st.button("CANCEL", key=f"cancel_{job['id']}"):
                        JobsRepository.update_status(job['id'], 'canceled')
                        st.rerun()

    # Modals
    if 'completing_job' in st.session_state:
        j = st.session_state.completing_job
        with st.form("comp_form"):
            st.subheader(f"FINALIZE: {j['name']}")
            ga = st.number_input("ACTUAL_GRAMS", value=float(j['grams_estimated'] or 0))
            ma = st.number_input("ACTUAL_MINUTES", value=float(j['minutes_estimated'] or 0))
            if st.form_submit_button("CONFIRM_TELEMETRY"):
                JobsRepository.update_status(j['id'], 'completed', {'grams_actual': ga, 'minutes_actual': ma})
                del st.session_state.completing_job
                st.rerun()

with tab3:
    st.header("ARCHIVE_LOGS")
    history = [j for j in JobsRepository.get_all() if j['status'] in ['completed', 'failed', 'canceled']]
    if history:
        st.dataframe(history, use_container_width=True)
    else:
        st.info("ARCHIVE_EMPTY")
