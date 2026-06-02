import streamlit as st
import plotly.express as px
import pandas as pd
from urllib.parse import urlencode
from caedoapi.ai.client import AIClient
from caedoapi.domain.costing import CostingEngine
from caedoapi.repositories.costs_repo import CostsRepository
from caedoapi.ui.styles import apply_custom_styles

st.set_page_config(page_title="Business — Caedo API", page_icon="💡", layout="wide")
apply_custom_styles()

st.title("MARKET_INTELLIGENCE")

# 1. Input Section
with st.container(border=True):
    st.subheader("PROPOSAL_EVALUATION")
    
    # Pre-fill from handoff if available
    initial_idea = ""
    if "handoff_eval" in st.session_state:
        initial_idea = st.session_state.handoff_eval["idea"]
        st.info(f"✨ Analyzing handoff: {st.session_state.handoff_eval.get('metadata', {}).get('filename', 'Unknown')}")
        
    idea = st.text_area("DESCRIBE_PRODUCT_CONCEPT (e.g. 'Industrial cable management rail for server racks')", value=initial_idea)
    platform = st.selectbox("TARGET_PLATFORM", ["Etsy", "Amazon", "Local Market", "Personal Webstore", "Other"])
    evaluate_btn = st.button("EXECUTE_AI_ANALYSIS")

# Logic to clear handoff after use or trigger auto-eval
if "handoff_eval" in st.session_state and not evaluate_btn and 'last_eval' not in st.session_state:
    # Auto-trigger evaluation if coming from handoff
    with st.spinner("AI_CONSULTANT_PROCESSING_HANDOFF..."):
        ai = AIClient()
        eval_data = ai.evaluate_idea(idea, platform)
        st.session_state.last_eval = eval_data
        # Keep handoff_eval to use grams later but clear idea trigger if needed? 
        # Actually it's fine.

if evaluate_btn or 'last_eval' in st.session_state:
    if not idea and 'last_eval' not in st.session_state:
        st.error("MISSING_DATA: Description required.")
    else:
        if evaluate_btn:
            with st.spinner("AI_CONSULTANT_PROCESSING..."):
                ai = AIClient()
                eval_data = ai.evaluate_idea(idea, platform)
                st.session_state.last_eval = eval_data
        
        eval_data = st.session_state.last_eval
        
        # 2. AI Terminal Section
        st.markdown("### STRATEGIC_INSIGHTS")
        
        # Custom CSS for Terminal
        st.markdown("""
        <style>
        .terminal-block {
            background-color: #050505;
            border: 1px solid #00FFCC;
            padding: 20px;
            font-family: 'JetBrains Mono', monospace;
            color: #00FFCC;
            margin-bottom: 30px;
            box-shadow: inset 0 0 10px rgba(0, 255, 204, 0.1);
        }
        .terminal-header {
            border-bottom: 1px solid #00FFCC;
            padding-bottom: 10px;
            margin-bottom: 15px;
            font-weight: 700;
            display: flex;
            justify-content: space-between;
        }
        </style>
        """, unsafe_allow_html=True)
        
        st.markdown(f"""
        <div class="terminal-block">
            <div class="terminal-header">
                <span>SYSTEM_READOUT // {eval_data.category.upper()}</span>
                <span>VER: 4.0.8</span>
            </div>
            <p>> {eval_data.reasoning}</p>
            <p><strong>RISK_FACTORS:</strong></p>
            <ul>
                {" ".join([f"<li>- {r}</li>" for r in eval_data.risks])}
            </ul>
        </div>
        """, unsafe_allow_html=True)
        
        k1, k2, k3 = st.columns(3)
        with k1: st.metric("DIFFICULTY_INDEX", f"{eval_data.difficulty}/5")
        with k2: st.metric("MARKET_PRICE", f"${eval_data.price_range_low:.0f}-${eval_data.price_range_high:.0f}")
        with k3: st.metric("PRIMARY_MAT", eval_data.suggested_materials[0] if eval_data.suggested_materials else "PLA")

        st.markdown("---")
        
        # 3. Cost Analysis Section
        st.subheader("PROFIT_TELEMETRY")
        
        settings = CostsRepository.get_all()
        
        col_ctrl, col_viz = st.columns([1, 1], gap="large")
        
        with col_ctrl:
            st.markdown("#### PARAMETER_ADJUSTMENT")
            
            # Use physical grams from handoff if available
            default_grams = float(eval_data.grams_estimate_low + eval_data.grams_estimate_high) / 2
            if "handoff_eval" in st.session_state:
                default_grams = st.session_state.handoff_eval["physical_grams"] or default_grams
                st.caption(f"📏 Using physical weight: {default_grams:.1f}g")

            grams = st.slider("WEIGHT (g)", 0.1, 1000.0, default_grams)
            minutes = st.slider("EXECUTION_TIME (min)", 1, 10080, int((eval_data.minutes_estimate_low + eval_data.minutes_estimate_high) / 2))
            sell_price = st.number_input("REVENUE_PER_UNIT ($)", min_value=1.0, value=eval_data.price_range_low)
            
            material = eval_data.suggested_materials[0] if eval_data.suggested_materials else "PLA"
            costs_result = CostingEngine.calculate_costs(grams, minutes, material, sell_price, settings)
            
            st.metric("NET_PROFIT", f"${costs_result['profit']:.2f}", delta=f"{costs_result['margin']:.1f}% MARGIN")

        with col_viz:
            st.markdown("#### COST_DISTRIBUTION")
            cost_data = costs_result['costs']
            cost_df = pd.DataFrame({
                "Category": [k.upper() for k in cost_data.keys()],
                "USD": list(cost_data.values())
            })
            fig = px.bar(cost_df, x="USD", y="Category", orientation='h', 
                         template="plotly_dark", color_discrete_sequence=["#00FFCC"])
            fig.update_layout(
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                margin=dict(l=0, r=0, t=0, b=0),
                xaxis=dict(showgrid=False),
                yaxis=dict(showgrid=False)
            )
            st.plotly_chart(fig, use_container_width=True)

        with st.expander("MATHEMATICAL_BREAKDOWN"):
            st.markdown(f"""
            - **MATERIAL:** {grams}g @ ${costs_result['formula_vars']['usd_per_kg']}/kg = **${costs_result['costs']['material']:.2f}**
            - **ENERGY:** {minutes}min @ ${costs_result['formula_vars']['kwh_rate']}/kWh = **${costs_result['costs']['electricity']:.2f}**
            - **OVERHEAD:** Packaging + Platform Fees = **${costs_result['costs']['packaging'] + costs_result['costs']['platform_fee']:.2f}**
            """)

        # 4. Listing Generation Section
        st.markdown("---")
        st.subheader("MARKETPLACE_DEPLOYMENT")
        
        if st.button("GENERATE_MARKETPLACE_LISTING"):
            with st.spinner("OPTIMIZING_SEO_COPY..."):
                ai = AIClient()
                listing = ai.generate_listing(idea, platform, eval_data)
                st.session_state.current_listing = listing

        if 'current_listing' in st.session_state:
            res = st.session_state.current_listing
            with st.container(border=True):
                st.markdown(f"#### LISTING_PREVIEW // {platform.upper()}")
                st.text_input("SEO_TITLE", value=res.title, disabled=True)
                st.text_area("PRODUCT_DESCRIPTION", value=res.description, height=200, disabled=True)
                st.text_input("OPTIMIZED_TAGS", value=", ".join(res.tags), disabled=True)
                st.info(f"PRICING_STRATEGY: {res.pricing_strategy}")
                
                if st.button("DISMISS_LISTING"):
                    del st.session_state.current_listing
                    st.rerun()

        # 5. NEW: Product Consultant Chat
        st.markdown("---")
        st.header("STRATEGIC_CONSULTATION")
        
        with st.expander("💬 ENGAGE_PRODUCT_CONSULTANT", expanded=False):
            if "product_messages" not in st.session_state:
                st.session_state.product_messages = []
            
            # Display chat history
            for msg in st.session_state.product_messages:
                with st.chat_message(msg["role"]):
                    st.markdown(msg["content"])
            
            if prompt := st.chat_input("Ask the consultant about your product idea..."):
                with st.chat_message("user"):
                    st.markdown(prompt)
                st.session_state.product_messages.append({"role": "user", "content": prompt})
                
                with st.chat_message("assistant"):
                    response_placeholder = st.empty()
                    full_response = ""
                    ai = AIClient()
                    for chunk in ai.stream_product_chat(st.session_state.product_messages.copy(), idea, platform, eval_data):
                        full_response += chunk
                        response_placeholder.markdown(full_response + "▌")
                    response_placeholder.markdown(full_response)
                st.session_state.product_messages.append({"role": "assistant", "content": full_response})

            # Design Handoff Trigger
            st.markdown("<br>", unsafe_allow_html=True)
            if st.button("🎨 GENERATE_3D_DESIGN_AGENT_HANDOFF", type="primary", use_container_width=True):
                with st.spinner("SYNTHESIZING_TECHNICAL_REQUIREMENTS..."):
                    ai = AIClient()
                    # Summarize conversation if it exists
                    summary = "\n".join([f"{m['role']}: {m['content']}" for m in st.session_state.product_messages[-4:]])
                    design_prompt = ai.generate_design_prompt(idea, eval_data, summary)
                    st.session_state.design_prompt = design_prompt
            
            if "design_prompt" in st.session_state:
                dp = st.session_state.design_prompt
                st.markdown("---")
                st.subheader(f"🛠️ {dp.design_prompt_title}")
                st.code(dp.design_prompt_body, language="markdown")
                
                with c2:
                    st.warning("**SUGGESTED_CAD_APPROACH:**\n" + dp.suggested_cad_approach)
                
                # --- VOICEFORGE 3D HANDOFF ---
                st.markdown("<br>", unsafe_allow_html=True)
                
                # Encode the prompt for URL
                base_url = "http://localhost:3000"
                # We combine the title and body for the AI agent to have full context
                full_handoff_prompt = f"Design Task: {dp.design_prompt_title}\n\nTechnical Requirements:\n{dp.design_prompt_body}\n\nConstraints:\n{', '.join(dp.key_constraints)}\n\nApproach:\n{dp.suggested_cad_approach}"
                
                query_params = urlencode({"prompt": full_handoff_prompt})
                caedo_url = f"{base_url}?{query_params}"
                
                # Use a custom HTML button for better cyberpunk styling and to open in new tab
                st.markdown(f"""
                <a href="{caedo_url}" target="_blank" style="text-decoration: none;">
                    <div style="
                        background-color: #00FFCC;
                        color: #050505;
                        padding: 12px 24px;
                        border-radius: 4px;
                        text-align: center;
                        font-weight: 800;
                        font-family: 'JetBrains Mono', monospace;
                        letter-spacing: 1px;
                        cursor: pointer;
                        box-shadow: 0 0 15px rgba(0, 255, 204, 0.4);
                        transition: all 0.3s ease;
                        margin-top: 10px;
                        border: none;
                    " onmouseover="this.style.boxShadow='0 0 25px rgba(0, 255, 204, 0.7)'; this.style.transform='scale(1.01)';" 
                       onmouseout="this.style.boxShadow='0 0 15px rgba(0, 255, 204, 0.4)'; this.style.transform='scale(1)';"
                    >
                        🚀 OPEN_IN_VOICEFORGE_3D
                    </div>
                </a>
                """, unsafe_allow_html=True)
                # -----------------------------
                
                if st.button("CLEAR_HANDOFF"):
                    del st.session_state.design_prompt
                    st.rerun()
