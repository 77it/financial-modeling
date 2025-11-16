# Estrazione dei dati da Excel

script excel_reader_vX.py


# Generazione dei dati random per elaborazione montecarlo su Excel o JavaScript

montecarlo_analyze_scenario_space_v5.py
+
montecarlo_generate_vX.py

	> python "C:\Users\u221509\OneDrive - Intesa SanPaolo\mci\zzz python dashboard\montecarlo_analyze_scenario_space_v5.py" --input "C:\Users\u221509\OneDrive - Intesa SanPaolo\mci\zzz python dashboard\montecarlo_input_template5.xlsx"
	
	&
	
	> python "C:\Users\u221509\OneDrive - Intesa SanPaolo\mci\zzz python dashboard\montecarlo_generate_v18.py" --input "C:\Users\u221509\OneDrive - Intesa SanPaolo\mci\zzz python dashboard\montecarlo_input_template5.xlsx" --out "C:\Users\u221509\OneDrive - Intesa SanPaolo\mci\zzz python dashboard\montecarlo_output2.txt"

What you care about	                         Runs (Sobol, scrambled)
Just middle (P50–P90)	                     16,384
Reliable P95 (business planning)	         32,768
P99 decent (stress test, regulatory style)   65,536–131,072

Plain finance translation
- If you need a planning “worst case” (bad but realistic), use 32,768 Sobol runs → stable P95.
- If you need a real stress scenario (very rare, almost disaster), go to 65,536 or 131,072 runs → stable P99.
- If you really want the absolute worst of all simulations, you’ll need hundreds of thousands of runs, but it’s less useful (because minimum keeps shifting when you add runs).

👉 For financial planning (cash covenants, bank discussions, etc.), P95 from ~33k runs is usually the sweet spot.
👉 For board stress tests: P99 from 65k–131k runs.


# Visualizzazione dei dati

## input

CSV "scenario, date, kpi, value" + header, first 3 rows are base + best + worst
with header of comments

	# company: ACME S.p.A.
	# currency: EUR


### sample random generator

plot_data_generator__csv.py

    > C:\profili\u221509\Downloads\sw\WPy64-312101\python\python "C:\Users\u221509\OneDrive - Intesa SanPaolo\mci\zzz python dashboard\plot_data_generator__csv.py"


## istruzioni

1) Creare un ambiente Python (consigliato)

	python -m venv .venv
	# Windows
	.venv\Scripts\activate
	# macOS/Linux
	source .venv/bin/activate

2) Installare le librerie

	pip install -r requirements.txt

3) Avvio del dashboard interattivo

	cd c:\profili\u221509\Downloads\sw\WPy64-312101\python
	.venv\Scripts\activate
	cd C:\Users\u221509\OneDrive - Intesa SanPaolo\mci\zzz python dashboard\mc_dashboard
	streamlit run app_streamlit/app.py

4) Apri il browser sull’URL mostrato in console

	tipicamente http://localhost:8501

4) Caricare i dati

	Puoi usare data/example.json come prova, oppure
	caricare un tuo JSON (con lo schema che mi hai passato) direttamente dall’interfaccia Streamlit (pannello laterale).

