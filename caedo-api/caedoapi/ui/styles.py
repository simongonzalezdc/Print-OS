import streamlit as st

def apply_custom_styles():
    """
    Injects custom CSS to achieve the Industrial Utilitarian aesthetic.
    """
    custom_css = """
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;700&display=swap" rel="stylesheet">

    <style>
        /* Typography */
        html, body, [class*="css"], .stMarkdown, .stButton, .stTextInput, .stSelectbox, div {
            font-family: 'JetBrains Mono', monospace !important;
        }

        h1, h2, h3 {
            text-transform: uppercase;
            letter-spacing: 2px;
            border-left: 5px solid #00FFCC;
            padding-left: 15px;
            margin-bottom: 25px !important;
        }

        /* Buttons */
        .stButton > button {
            border-radius: 0px !important;
            border: 1px solid #00FFCC !important;
            background-color: transparent !important;
            color: #00FFCC !important;
            text-transform: uppercase;
            font-weight: 700;
            transition: all 0.3s ease;
            width: 100%;
        }

        .stButton > button:hover {
            background-color: #00FFCC !important;
            color: #0D0D0D !important;
            box-shadow: 0 0 15px rgba(0, 255, 204, 0.4);
        }

        /* Cards/Containers */
        div[data-testid="stVerticalBlock"] > div[style*="border"] {
            border-radius: 0px !important;
            border: 1px solid #333 !important;
            background-color: #111 !important;
            transition: border-color 0.3s ease;
        }

        div[data-testid="stVerticalBlock"] > div[style*="border"]:hover {
            border-color: #00FFCC !important;
        }

        /* Metrics */
        [data-testid="stMetricValue"] {
            font-size: 2.5rem !important;
            font-weight: 700 !important;
            color: #00FFCC !important;
        }

        /* Sidebar */
        [data-testid="stSidebar"] {
            background-color: #050505 !important;
            border-right: 1px solid #222;
        }

        /* Tabs */
        .stTabs [data-baseweb="tab-list"] {
            gap: 10px;
            background-color: transparent;
        }

        .stTabs [data-baseweb="tab"] {
            border-radius: 0px !important;
            background-color: #1A1A1A;
            border: 1px solid #333;
            color: #888;
            padding: 10px 20px;
        }

        .stTabs [aria-selected="true"] {
            background-color: #00FFCC !important;
            color: #0D0D0D !important;
            border-color: #00FFCC !important;
        }

        /* Plotly Backgrounds */
        .js-plotly-plot .plotly, .js-plotly-plot .plotly div {
            background-color: transparent !important;
        }

        /* Scrollbar */
        ::-webkit-scrollbar {
            width: 5px;
        }
        ::-webkit-scrollbar-track {
            background: #0D0D0D;
        }
        ::-webkit-scrollbar-thumb {
            background: #333;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #00FFCC;
        }
    </style>
    """
    st.markdown(custom_css, unsafe_allow_html=True)
