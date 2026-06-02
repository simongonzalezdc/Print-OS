import streamlit as st
import pandas as pd
import plotly.express as px
from caedoapi.repositories.jobs_repo import JobsRepository
from caedoapi.repositories.ai_usage_repo import AIUsageRepository
from caedoapi.ui.styles import apply_custom_styles
from caedoapi.ai.client import AIClient

st.set_page_config(page_title="Reports — Caedo API", page_icon="📊", layout="wide")
apply_custom_styles()

ai = AIClient()

st.title("ANALYTICS_REPORT")

# AI Usage Metadata
with st.sidebar:
    st.markdown("---")
    st.header("AI_INFRASTRUCTURE_V2")
    usage = AIUsageRepository.get_summary()
    if usage:
        st.metric("TOTAL_AI_CALLS", usage.get('total_calls', 0))
        st.metric("TOTAL_TOKENS", f"{usage.get('total_tokens', 0):,}")

# 1. Fetch Data
all_jobs = JobsRepository.get_all()
if not all_jobs:
    st.info("NO_TELEMETRY_DATA: Complete jobs to generate reports.")
else:
    df = pd.DataFrame(all_jobs)
    
    # 2. Date Filtering
    st.sidebar.header("FILTER_PARAMS")
    df['created_at'] = pd.to_datetime(df['created_at'])
    min_date = df['created_at'].min().date()
    max_date = df['created_at'].max().date()
    
    date_range = st.sidebar.date_input("TEMPORAL_RANGE", value=[min_date, max_date], min_value=min_date, max_value=max_date)
    
    if len(date_range) == 2:
        start_date, end_date = date_range
        df = df[(df['created_at'].dt.date >= start_date) & (df['created_at'].dt.date <= end_date)]

    # AI Insight Section
    if st.button("GENERATE_OPERATIONAL_INSIGHT"):
        with st.spinner("ANALYZING_TELEMETRY_DATA..."):
            # Prepare telemetry summary for AI
            telemetry = {
                "total_jobs": len(df),
                "completed": len(df[df['status'] == 'completed']),
                "failed": len(df[df['status'] == 'failed']),
                "avg_minutes": df[df['status'] == 'completed']['minutes_actual'].mean() if not df[df['status'] == 'completed'].empty else 0,
                "materials_usage": df['material'].value_counts().to_dict()
            }
            insight = ai.generate_daily_summary(telemetry)
            if insight:
                st.session_state.current_insight = insight
    
    if 'current_insight' in st.session_state:
        with st.container(border=True):
            st.markdown("### AI_OPERATIONAL_INSIGHT")
            st.markdown(st.session_state.current_insight)
            if st.button("DISMISS_INSIGHT"):
                del st.session_state.current_insight
                st.rerun()

    # 3. KPI Row
    st.subheader("SYSTEM_PERFORMANCE_METRICS")
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.metric("TOTAL_TASKS", len(df))
    with c2:
        comp_count = len(df[df['status'] == 'completed'])
        st.metric("SUCCESS_EXE", comp_count)
    with c3:
        fail_count = len(df[df['status'] == 'failed'])
        st.metric("FAILURE_LOGS", fail_count)
    with c4:
        rate = (comp_count / (comp_count + fail_count) * 100) if (comp_count + fail_count) > 0 else 0
        st.metric("YIELD_RATE", f"{rate:.1f}%")

    st.markdown("---")

    # 4. Charts
    chart_config = {
        "template": "plotly_dark",
        "color_discrete_sequence": ["#00FFCC", "#1A1A1A", "#333333"]
    }

    row1_c1, row1_c2 = st.columns(2)
    
    with row1_c1:
        st.subheader("DISTRIBUTION: HARDWARE_LOAD")
        if not df['assigned_printer_name'].dropna().empty:
            p_counts = df['assigned_printer_name'].value_counts().reset_index()
            p_counts.columns = ['Unit', 'Load']
            fig1 = px.bar(p_counts, x='Load', y='Unit', orientation='h', **chart_config)
            fig1.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)')
            st.plotly_chart(fig1, use_container_width=True)
        else:
            st.info("DATA_NOT_FOUND: Assignment telemetry missing.")

    with row1_c2:
        st.subheader("DISTRIBUTION: OUTCOME_STATE")
        s_counts = df['status'].value_counts().reset_index()
        s_counts.columns = ['State', 'Total']
        fig2 = px.pie(s_counts, values='Total', names='State', hole=0.5, **chart_config)
        fig2.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)')
        st.plotly_chart(fig2, use_container_width=True)

    row2_c1, row2_c2 = st.columns(2)

    with row2_c1:
        st.subheader("ANALYSIS: MATERIAL_FAILURE")
        fail_df = df[df['status'] == 'failed']
        if not fail_df.empty:
            m_fails = fail_df['material'].value_counts().reset_index()
            m_fails.columns = ['Type', 'Event_Count']
            fig3 = px.bar(m_fails, x='Type', y='Event_Count', **chart_config)
            fig3.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)')
            st.plotly_chart(fig3, use_container_width=True)
        else:
            st.success("NO_FAILURES_DETECTED")

    with row2_c2:
        st.subheader("ANALYSIS: MEAN_EXECUTION_TIME (MIN)")
        comp_df = df[df['status'] == 'completed'].dropna(subset=['minutes_actual', 'assigned_printer_name'])
        if not comp_df.empty:
            avg_t = comp_df.groupby('assigned_printer_name')['minutes_actual'].mean().reset_index()
            avg_t.columns = ['Unit', 'Mean_Time']
            fig4 = px.bar(avg_t, x='Unit', y='Mean_Time', **chart_config)
            fig4.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)')
            st.plotly_chart(fig4, use_container_width=True)
        else:
            st.info("DATA_NOT_FOUND: Execution telemetry missing.")

    # 5. AI Usage Visualization
    st.markdown("---")
    st.subheader("AI_INFRASTRUCTURE: TOKEN_DISTRIBUTION")
    usage_data = AIUsageRepository.get_all()
    if usage_data:
        u_df = pd.DataFrame(usage_data)
        fig_u = px.sunburst(u_df, path=['model', 'feature'], values='total_tokens', 
                            template="plotly_dark", color_discrete_sequence=["#00FFCC", "#008877"])
        fig_u.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)')
        st.plotly_chart(fig_u, use_container_width=True)
    else:
        st.info("NO_AI_USAGE_LOGGED")
