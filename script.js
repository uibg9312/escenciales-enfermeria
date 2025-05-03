
    if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js') // Asegúrate que la ruta es correcta
        .then(registration => {
          console.log('ServiceWorker registrado con éxito con scope: ', registration.scope);
        })
        .catch(error => {
          console.log('Fallo en el registro del ServiceWorker: ', error);
        });
    });
  }

  
    // --- TAB SWITCHING LOGIC ---
    const btnCalcTab = document.getElementById('btnCalcTab');
    const btnNandaTab = document.getElementById('btnNandaTab');
    const calculatorContent = document.getElementById('calculatorContent');
    const nandaContent = document.getElementById('nandaContent');

    function showTab(tabName) {
        // Hide all content divs
        calculatorContent.style.display = 'none';
        nandaContent.style.display = 'none';
        // Deactivate all tab buttons
        btnCalcTab.classList.remove('active');
        btnNandaTab.classList.remove('active');

        // Activate the selected tab and show its content
        if (tabName === 'calculator') {
            calculatorContent.style.display = 'block';
            btnCalcTab.classList.add('active');
        } else if (tabName === 'nanda') {
            nandaContent.style.display = 'block';
            btnNandaTab.classList.add('active');
        }
    }
    // Set the initial active tab (optional, defaults to calculator due to initial HTML)
    showTab('calculator');

    // --- CALCULATOR SCRIPT (IIFE Wrapper) ---
    (function() {
        const $ = id => document.getElementById(id);
        // Helper to get numeric value, ensuring it's part of the visible calculator tab
        const numVal = id => {
            const el = $(id);
            // Ensure element exists and is within the calculator tab's content
            if (!el || !el.closest('#calculatorContent')) return NaN;
            // Additional check: If element is part of a custom section that's hidden, return NaN
            const customSectionParent = el.closest('.custom-input-section');
            if (customSectionParent && customSectionParent.style.display === 'none') {
                return NaN;
            }
            // Standard value check
            const value = el.value;
            if (value === null || value.trim() === '') return NaN;
            const num = Number(value);
            return isNaN(num) ? NaN : num;
        };
        const round = (n, decimals = 2) => Number(n.toFixed(decimals));
        const pct2meq = p => p * 10000 / 58.5; // Convert % NaCl (p/V) to mEq/L
        const baseSolutions = { NS_0_9:{name:'NaCl 0.9%',mEqNa:154},NS_0_45:{name:'NaCl 0.45%',mEqNa:77},LR:{name:'Lactato de Ringer',mEqNa:130},D5W:{name:'Dextrosa 5%',mEqNa:0},D5_NS45:{name:'D5 + NaCl 0.45%',mEqNa:77}};
        const concSolutions = { NaCl3:{name:'NaCl 3% (30mL)',mEqNaAmp:15.4,volAmp:30},NaCl17_7:{name:'NaCl 17.7% (20mL)',mEqNaAmp:30,volAmp:20},Bic8_4:{name:'Bicarbonato 8.4% (100mL)',mEqNaAmp:100,volAmp:100}}; // Approx Na+ from Bic
        const glucoseBaseSolutions = { SW: {name: 'Agua Estéril', pct: 0}, D5W: {name: 'Dextrosa 5%', pct: 5}, D10W: {name: 'Dextrosa 10%', pct: 10} };
        const glucoseConcSolutions = { D10W: {name: 'Dextrosa 10%', pct: 10}, D50W: {name: 'Dextrosa 50%', pct: 50} };
        const formulas = { normo: 'P.I. (mL) ≈ 0.5 × Peso (kg) × Horas', hiper: 'P.I. (mL) ≈ (0.5 × P × H) + (2 × P × Grados > 37°C × H)\n(Factor 2 para fiebre; verificar protocolo local)', venti: 'P.I. (mL) ≈ 3 × Peso (kg) × Horas\n(Factor 3 para ventilador; verificar protocolo local)', quemaduras: 'P.I. (mL) ≈ 15 × Peso (kg) × Constante × Horas\n(Verificar constante y protocolo local)', scq: 'BSA (m²) (<10kg): (Peso×4+9)/100\nBSA (m²) (≥10kg): (Peso×4+7)/100', perdidasPedia: 'P.I. Pediátrica (mL) ≈ BSA (m²) × Constante (mL/m²/día) / 24 × Horas\n(Requiere valor de BSA; Verificar constante según protocolo clínico)', perdidasNeo: 'P.I. Neonatal (mL) ≈ Peso (kg) × k × Horas\n(k varía según peso y estado; verificar protocolo neonatal específico)', imc: 'IMC (kg/m²) = Peso (kg) / (Estatura (m))²', pam: 'PAM (mmHg) ≈ PAD + (PAS - PAD) / 3\n(Presión Arterial Media)', pvc: 'Info PVC (Presión Venosa Central):\n• Mide presión en vena cava/aurícula derecha.\n• Refleja volemia y precarga del ventrículo derecho.\n• Se mide directamente con Catéter Venoso Central (CVC).\n• Valor normal ≈ 2-8 mmHg ó 3-10 cmH₂O (verificar protocolo).', mixGlucosa: 'Calcula volúmenes para mezcla glucosada:\nVol (Conc) = Vol Total × (% Obj - % Base) / (% Conc - % Base)', gir: 'TIG/GIR (mg/kg/min) = (Flujo (mL/hr) × Conc Glucosa (%)) / (Peso (kg) × 6)', volGlucosa: 'Volumen (mL) = Gramos Glucosa Necesarios × 100 / Conc Glucosa (%)', dosisVol: 'Volumen (mL) = Dosis Requerida (unidad) / Concentración (unidad/mL)\n(Las unidades deben coincidir o ser convertibles mg/mcg)', dosisPeso: 'Dosis Total = Dosis Prescrita (unidad/kg) × Peso (kg)', convMgMcg: 'mg = mcg / 1000 | mcg = mg × 1000', convGMg: 'g = mg / 1000 | mg = g × 1000', velocidadInf: 'Velocidad (mL/hr) = Volumen Total (mL) / Tiempo Total (hr)', calculoGoteo: 'Goteo (gotas/min) = (Volumen Total (mL) × Factor Goteo (gotas/mL)) / Tiempo Total (min)', mix: 'Algoritmo para calcular mezcla salina para alcanzar Na⁺ deseado.' };

        function limpiar() {
             const form = $("formulario");
             const formulaArea = $("formulaDisplayArea");
             const resultDiv = $("result");
             const calcBtn = $('calcBtn');
             const calcTypeSelect = $('calcType');
             if (form && form.closest('#calculatorContent')) form.innerHTML = ''; // Check parent
             if (formulaArea && formulaArea.closest('#calculatorContent')) formulaArea.innerHTML = '';
             if (resultDiv && resultDiv.closest('#calculatorContent')) resultDiv.innerHTML = '';
             if (calcBtn && calcBtn.closest('#calculatorContent')) calcBtn.disabled = false;
             if (calcTypeSelect && calcTypeSelect.closest('#calculatorContent')) { calcTypeSelect.classList.remove('option-selected'); } // Custom class to maybe style the select when an option is chosen
        }

        function input(id, l, ph = '', type = 'number', step = 'any') {
             const minAttr = (type === 'number' && id !== 'grados') ? ' min="0"' : ''; // Prevent negative inputs except for temp diff
             const rangeMatch = l.match(/\((\d+)-(\d+)\)/); // Basic range detection from label e.g. "Constante (1-6)"
             const rangeAttr = (type === 'number' && rangeMatch) ? ` min="${rangeMatch[1]}" max="${rangeMatch[2]}"` : minAttr; // Apply range or just min="0"
             return `<label for="${id}">${l}</label><input id="${id}" type="${type}" step="${step}" placeholder="${ph || 'Ingrese valor...'}" required${rangeAttr}>`;
        }

        function options(o) {
             return Object.entries(o).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('');
        }

        function select(id, l, optionsHtml) {
             return `<label for="${id}">${l}</label><select id="${id}" required>${optionsHtml}</select>`;
        }

        function updPctHelper() {
             const p = numVal("targetPercent");
             const h = $("percentHelper");
             if (!h || !h.closest('#calculatorContent')) return; // Ensure it's the calculator helper
             h.textContent = (!isNaN(p) && p > 0) ? `≈ ${round(pct2meq(p))} mEq/L Na⁺` : '';
        }

        function toggleCustomInputs(selectId, customDivId) {
            const selectEl = $(selectId);
            const customDiv = $(customDivId);
            if (selectEl && customDiv && selectEl.closest('#calculatorContent')) { // Check context
                customDiv.style.display = (selectEl.value === 'custom') ? 'block' : 'none';
            }
            const calcType = $("calcType")?.value;
            const resultDiv = $("result");
             // Clear results if mix inputs change
             if ((calcType === 'mix' || calcType === 'mixGlucosa') && resultDiv && resultDiv.closest('#calculatorContent')) {
                resultDiv.innerHTML = '';
            }
        }

        window.renderInputs = function() {
            limpiar();
            const t = $("calcType")?.value;
            if (!t) return; // No calculation selected

            const formContainer = $("formulario");
            const formulaDisplayContainer = $("formulaDisplayArea");
            const calcButton = $('calcBtn');

            // Ensure containers exist and are within the calculator tab
            if (!formContainer || !formContainer.closest('#calculatorContent') ||
                !formulaDisplayContainer || !formulaDisplayContainer.closest('#calculatorContent') ||
                !calcButton || !calcButton.closest('#calculatorContent')) {
                console.error("Calculator containers not found or out of scope.");
                return;
            }

            let htmlInputs = '';
            let displayHtml = '';
            let additionalInfoHtml = '';
            let isInfoOnly = false;

            // Add a visual cue that an option is selected
             const calcTypeSelect = $('calcType');
             if (calcTypeSelect && t) { calcTypeSelect.classList.add('option-selected'); }

            if (t && formulas[t]) {
                 const displayClass = (t === 'pvc') ? 'info-display-static' : 'formula-display-static';
                 displayHtml = `<div class="${displayClass}">${formulas[t]}</div>`;
            }

            switch (t) {
                 case 'normo': case 'venti':
                     htmlInputs += input('peso', 'Peso (kg)');
                     htmlInputs += input('horas', 'Horas');
                     break;
                 case 'hiper':
                     htmlInputs += input('peso', 'Peso (kg)');
                     htmlInputs += input('grados', '°C sobre 37'); // Allows negative if needed, but min="0" removed
                     htmlInputs += input('horas', 'Horas');
                     break;
                 case 'quemaduras':
                     htmlInputs += input('peso', 'Peso (kg)');
                     htmlInputs += input('constante', 'Constante (1-6)'); // Range set by input() automatically
                     htmlInputs += input('horas', 'Horas');
                     additionalInfoHtml = `<div class="constante-info"><strong>Guía para elegir Constante:</strong><ul><li>Constante 1 = 1-10% SCQ*</li><li>Constante 2 = 11-20% SCQ*</li><li>Constante 3 = 21-40% SCQ*</li><li>Constante 4 = 41-60% SCQ*</li><li>Constante 5 = 61-80% SCQ*</li><li>Constante 6 = 81-100% SCQ*</li></ul><small>*Superficie Corporal Quemada</small></div>`;
                     break;
                 case 'scq':
                     htmlInputs += input('peso', 'Peso (kg)');
                     htmlInputs += `<label for="grupo">Grupo Edad/Peso</label><select id="grupo" required><option value="" disabled selected hidden>— Elija grupo —</option><option value="u10"><10 kg</option><option value="o10">≥10 kg</option></select>`;
                     break;
                 case 'perdidasPedia':
                     htmlInputs += input('scqValor', 'BSA/SCQ (m²)');
                     htmlInputs += `<label for="constPedia">Estado / Constante Pediátrica</label><select id="constPedia" required><option value="" disabled selected hidden>— Elija estado —</option><option value="400">400 – Normotérmico</option><option value="500">500 – Hipertermia/Fototerapia</option><option value="100">100 – Sepsis</option></select>`;
                     htmlInputs += input('horas', 'Horas');
                     break;
                 case 'perdidasNeo':
                     htmlInputs += input('peso', 'Peso (kg)');
                     htmlInputs += input('horas', 'Horas');
                     htmlInputs += `<label for="estadoNeo">Estado Neonatal</label><select id="estadoNeo" required><option value="" disabled selected hidden>— Elija estado —</option><option value="normo">Normotérmico (k=1.5 o 1.8)</option><option value="hiper">Hipertermia/Fototerapia (k=2.6 o 2.8)</option></select>`;
                     break;
                 case 'imc':
                     htmlInputs += input('peso', 'Peso (kg)');
                     htmlInputs += input('estatura', 'Estatura (m)', 'Ej: 1.75');
                     break;
                 case 'pam':
                     htmlInputs += input('pas', 'Presión Arterial Sistólica (PAS)', 'mmHg');
                     htmlInputs += input('pad', 'Presión Arterial Diastólica (PAD)', 'mmHg');
                     break;
                 case 'pvc':
                     isInfoOnly = true; // Only display info, disable button
                     break;
                 case 'dosisVol':
                     htmlInputs += `<div class="input-unit-grid">`;
                     htmlInputs += `<div>${input('dosisReq', 'Dosis Requerida')}</div>`;
                     htmlInputs += `<div>${select('dosisReqUnidad', 'Unidad Dosis', '<option value="mg">mg</option><option value="mcg">mcg</option><option value="U">U</option>')}</div>`;
                     htmlInputs += `</div>`;
                     htmlInputs += `<div class="input-unit-grid">`;
                     htmlInputs += `<div>${input('concentracion', 'Concentración')}</div>`;
                     htmlInputs += `<div>${select('concentracionUnidad', 'Unidad Concentración', '<option value="mg/mL">mg/mL</option><option value="mcg/mL">mcg/mL</option><option value="U/mL">U/mL</option>')}</div>`;
                     htmlInputs += `</div>`;
                     break;
                 case 'dosisPeso':
                     htmlInputs += `<div class="input-unit-grid">`;
                     htmlInputs += `<div>${input('dosisPrescrita', 'Dosis Prescrita')}</div>`;
                     htmlInputs += `<div>${select('dosisPrescritaUnidad', 'Unidad Dosis', '<option value="mg/kg">mg/kg</option><option value="mcg/kg">mcg/kg</option>')}</div>`;
                     htmlInputs += `</div>`;
                     htmlInputs += input('pesoDosis', 'Peso Paciente (kg)');
                     break;
                 case 'velocidadInf':
                     htmlInputs += input('volTotalInf', 'Volumen Total (mL)');
                     htmlInputs += input('tiempoHrInf', 'Tiempo Total (hr)');
                     break;
                 case 'calculoGoteo':
                     htmlInputs += input('volTotalGoteo', 'Volumen Total (mL)');
                     htmlInputs += input('tiempoMinGoteo', 'Tiempo Total (min)');
                     htmlInputs += `<label for="factorGoteo">Factor Goteo (gotas/mL)</label><select id="factorGoteo" required><option value="" disabled selected hidden>— Elija factor —</option><option value="10">10 gtt/mL (Macrogotero)</option><option value="15">15 gtt/mL (Macrogotero)</option><option value="20">20 gtt/mL (Macrogotero)</option><option value="60">60 gtt/mL (Microgotero)</option></select>`;
                     break;
                 case 'mixGlucosa':
                     htmlInputs += input('targetVolGlucosa', 'Volumen Final Deseado (mL)');
                     htmlInputs += input('targetPctGlucosa', 'Concentración Glucosa Objetivo (%)');
                     htmlInputs += `<label for="baseSelGlucosa">Solución Base Glucosada</label><select id="baseSelGlucosa" required><option value="" disabled selected hidden>— Elija base —</option>${options(glucoseBaseSolutions)}</select>`;
                     htmlInputs += `<label for="concSelGlucosa">Solución Concentrada Glucosada</label><select id="concSelGlucosa" required><option value="" disabled selected hidden>— Elija concentrado —</option>${options(glucoseConcSolutions)}</select>`;
                     break;
                 case 'gir':
                     htmlInputs += input('flujoGir', 'Flujo Infusión (mL/hr)');
                     htmlInputs += input('concGir', 'Concentración Glucosa (%)');
                     htmlInputs += input('pesoGir', 'Peso Paciente (kg)');
                     break;
                 case 'volGlucosa':
                     htmlInputs += input('gramosGlucosa', 'Gramos Glucosa Necesarios (g)');
                     htmlInputs += input('concVolGlucosa', 'Concentración Glucosa Disponible (%)');
                     break;
                 case 'mix':
                     htmlInputs += `<label for="objetivoTipo">Tipo de objetivo Na⁺</label><select id="objetivoTipo" onchange="toggleObjetivo()" required><option value="percent">% NaCl final (p/V)</option><option value="conc">Concentración final (mEq/L)</option><option value="total">mEq Na⁺ totales</option></select>`;
                     htmlInputs += `<div id="objPercent">${input('targetPercent', '% NaCl (p/V)', 'Ej: 0.9')}<p id="percentHelper"></p></div>`;
                     htmlInputs += `<div id="objConc" style="display:none">${input('targetConc', 'Concentración deseada (mEq/L)', 'Ej: 154')}</div>`;
                     htmlInputs += `<div id="objTotal" style="display:none">${input('targetMeq', 'mEq Na⁺ totales deseados')}</div>`;
                     htmlInputs += input('targetVol', 'Volumen final (mL)', 'Ej: 1000');
                     htmlInputs += `<label for="baseSel">Solución base Salina</label><select id="baseSel" onchange="toggleCustomInputs('baseSel', 'customBaseInputs')" required><option value="" disabled selected hidden>— Elija base —</option>${options(baseSolutions)}<option value="custom">Otra...</option></select>`;
                     htmlInputs += `<div id="customBaseInputs" class="custom-input-section" style="display:none;">${input('customBasePct', '% NaCl (p/V) de base personalizada', 'Ej: 0.3')}</div>`;
                     htmlInputs += `<label for="concSel">Solución concentrada Salina</label><select id="concSel" onchange="toggleCustomInputs('concSel', 'customConcInputs')" required><option value="" disabled selected hidden>— Elija concentrado —</option>${options(concSolutions)}<option value="custom">Otra...</option></select>`;
                     htmlInputs += `<div id="customConcInputs" class="custom-input-section" style="display:none;"><div class="grid">`;
                     htmlInputs += `<div>${input('customConcVol', 'Volumen ampolla/unidad (mL)', 'Ej: 10')}</div>`;
                     htmlInputs += `<div>${input('customConcPct', '% NaCl (p/V) de concentrado', 'Ej: 20')}</div>`;
                     htmlInputs += `</div></div>`;
                     break;
                 case 'convMgMcg':
                     htmlInputs += input('valorMgMcg', 'Valor');
                     htmlInputs += `<label for="dirMgMcg">Convertir de:</label><select id="dirMgMcg" required><option value="mg_mcg">Miligramos (mg) a Microgramos (mcg)</option><option value="mcg_mg">Microgramos (mcg) a Miligramos (mg)</option></select>`;
                     break;
                 case 'convGMg':
                     htmlInputs += input('valorGMg', 'Valor');
                     htmlInputs += `<label for="dirGMg">Convertir de:</label><select id="dirGMg" required><option value="g_mg">Gramos (g) a Miligramos (mg)</option><option value="mg_g">Miligramos (mg) a Gramos (g)</option></select>`;
                     break;
            }
            formContainer.innerHTML = htmlInputs;
            formulaDisplayContainer.innerHTML = displayHtml + additionalInfoHtml;
            calcButton.disabled = isInfoOnly; // Disable button for info-only sections like PVC

            // Re-attach listeners or setup for specific cases like 'mix'
            if (t === 'mix') {
                 const targetPercentInput = $("targetPercent");
                 if(targetPercentInput && targetPercentInput.closest('#calculatorContent')) { // Check context
                     targetPercentInput.addEventListener('input', updPctHelper);
                 }
                 toggleObjetivo(); // Set initial visibility based on default selection
                 toggleCustomInputs('baseSel', 'customBaseInputs');
                 toggleCustomInputs('concSel', 'customConcInputs');
             }
        };

        window.toggleObjetivo = function() {
             const tipoSelect = $("objetivoTipo");
             if (!tipoSelect || !tipoSelect.closest('#calculatorContent')) return; // Ensure context

             const tipo = tipoSelect.value;
             const objConc = $("objConc");
             const objTotal = $("objTotal");
             const objPercent = $("objPercent");

             if (objConc && objConc.closest('#calculatorContent')) objConc.style.display = (tipo === 'conc') ? 'block' : 'none';
             if (objTotal && objTotal.closest('#calculatorContent')) objTotal.style.display = (tipo === 'total') ? 'block' : 'none';
             if (objPercent && objPercent.closest('#calculatorContent')) objPercent.style.display = (tipo === 'percent') ? 'block' : 'none';

             updPctHelper(); // Update helper text based on current visibility
        }

        window.calcular = function() {
            const t = $("calcType")?.value;
            const resultDiv = $("result");

            // Ensure resultDiv exists and is in the calculator context
            if (!resultDiv || !resultDiv.closest('#calculatorContent')) {
                 console.error("Result area not found or out of scope.");
                 return;
            }
            resultDiv.innerHTML = ''; // Clear previous result

            if (!t || t === 'pvc') {
                 resultDiv.textContent = (t === 'pvc') ? 'Sección informativa. No hay cálculo.' : 'Por favor, seleccione un tipo de cálculo.';
                 resultDiv.style.color = (t === 'pvc') ? '#4a5568' : '#e53e3e';
                 return;
            }

            const form = $('formulario');
             // Ensure form exists and is in calculator context
            if (!form || !form.closest('#calculatorContent')) {
                 console.error("Form not found or out of scope.");
                 resultDiv.innerHTML = `<div style="color: #c53030; font-weight: bold;">Error interno: Formulario no encontrado.</div>`;
                 resultDiv.style.color = '#c53030';
                 return;
            }

            // --- Basic Form Validation ---
            if (!form.checkValidity()) {
                 let errorMessage = 'Por favor, complete todos los campos requeridos.';
                 const firstInvalid = form.querySelector(':invalid');
                 if (firstInvalid) {
                     const label = firstInvalid.labels && firstInvalid.labels.length > 0 ? firstInvalid.labels[0].textContent : (firstInvalid.id || 'un campo requerido');
                     errorMessage = `Por favor, ingrese un valor válido para "${label}".`;
                     // Briefly highlight the invalid field
                     firstInvalid.style.outline = '2px solid red';
                     firstInvalid.style.borderColor = 'red'; // Also change border for better visibility
                     setTimeout(() => {
                         if(firstInvalid) {
                              firstInvalid.style.outline = '';
                              firstInvalid.style.borderColor = ''; // Reset border color
                         }
                     }, 2500);
                     firstInvalid.focus(); // Focus the first invalid field
                 }
                 resultDiv.innerHTML = `<div style="color: #c53030; font-weight: bold;">${errorMessage}</div>`;
                 resultDiv.style.color = '#c53030';
                 return;
            }

            // --- Check for Non-Numeric Values in Number Inputs ---
            let hasNaNError = false;
             const numberInputs = form.querySelectorAll('input[type="number"]');
             numberInputs.forEach(el => {
                 // Check only visible inputs
                 if (el.offsetParent !== null || (el.closest && el.closest('.custom-input-section')?.style.display !== 'none')) {
                     const val = el.value;
                     if (val.trim() !== '' && isNaN(Number(val))) {
                         hasNaNError = true;
                         console.warn(`Input ${el.id} has non-numeric value: ${val}`);
                         el.style.outline = '2px solid orange';
                         el.style.borderColor = 'orange';
                         setTimeout(() => {
                             if(el) {
                                  el.style.outline = '';
                                  el.style.borderColor = '';
                              }
                         }, 2500);
                     }
                 }
             });

             if (hasNaNError) {
                 resultDiv.innerHTML = `<div style="color: #dd6b20; font-weight: bold;">Error: Verifique que todos los campos numéricos contengan solo números válidos (sin letras ni símbolos excepto el punto decimal).</div>`;
                 resultDiv.style.color = '#dd6b20';
                 return;
             }

            // --- Perform Calculation ---
            let r; // Result variable
            let unit = ''; // Unit string
            try {
                 switch (t) {
                     case 'normo':
                         r = 0.5 * numVal('peso') * numVal('horas'); unit = 'mL';
                         if (r < 0) throw new Error("El resultado no puede ser negativo.");
                         break;
                     case 'hiper':
                         r = (0.5 * numVal('peso') * numVal('horas')) + (2 * numVal('peso') * numVal('grados') * numVal('horas')); unit = 'mL';
                          if (r < 0) throw new Error("El resultado no puede ser negativo.");
                         break;
                     case 'venti':
                         r = 3 * numVal('peso') * numVal('horas'); unit = 'mL';
                          if (r < 0) throw new Error("El resultado no puede ser negativo.");
                         break;
                     case 'quemaduras':
                         const constante = numVal('constante');
                          if (constante < 1 || constante > 6) throw new Error("La constante debe estar entre 1 y 6.");
                         r = 15 * numVal('peso') * constante * numVal('horas'); unit = 'mL';
                          if (r < 0) throw new Error("El resultado no puede ser negativo.");
                         break;
                     case 'scq': {
                         const pesoScq = numVal('peso');
                         if (isNaN(pesoScq) || pesoScq <= 0) throw new Error("El peso debe ser mayor a 0.");
                         const grupo = $("grupo")?.value;
                         if (!grupo) throw new Error("Seleccione el grupo de edad/peso.");
                         r = (grupo === 'u10') ? (pesoScq * 4 + 9) / 100 : (pesoScq * 4 + 7) / 100;
                         unit = 'm²';
                         break;
                     }
                     case 'perdidasPedia': {
                         const bsa = numVal('scqValor');
                         const constantePedia = numVal('constPedia');
                         const horasPedia = numVal('horas');
                         if (isNaN(bsa) || bsa <= 0) throw new Error("BSA/SCQ ingresado debe ser mayor a 0.");
                         if (isNaN(constantePedia)) throw new Error("Seleccione una constante pediátrica.");
                         if (isNaN(horasPedia) || horasPedia < 0) throw new Error("Las horas no pueden ser negativas.");
                         r = bsa * constantePedia / 24 * horasPedia;
                         unit = 'mL';
                         break;
                     }
                     case 'perdidasNeo': {
                         const pesoNeo = numVal('peso');
                         const estadoNeo = $("estadoNeo")?.value;
                         const horasNeo = numVal('horas');
                         if (isNaN(pesoNeo) || pesoNeo <= 0) throw new Error("El peso debe ser mayor a 0.");
                         if (!estadoNeo) throw new Error("Seleccione el estado neonatal.");
                         if (isNaN(horasNeo) || horasNeo < 0) throw new Error("Las horas no pueden ser negativas.");
                         // Determine constant 'k' based on weight and state
                         const k = pesoNeo < 2
                             ? (estadoNeo === 'normo' ? 1.5 : 2.6)
                             : (estadoNeo === 'normo' ? 1.8 : 2.8);
                         r = pesoNeo * k * horasNeo;
                         unit = 'mL';
                         break;
                     }
                     case 'imc':
                         const pesoImc = numVal('peso');
                         const estatura = numVal('estatura');
                         if (isNaN(pesoImc) || pesoImc <= 0) throw new Error("El peso debe ser mayor a 0.");
                         if (isNaN(estatura) || estatura <= 0) throw new Error("La estatura debe ser mayor a 0.");
                          if (estatura > 3) console.warn("Estatura > 3 metros, verificar si está en metros (ej: 1.75)."); // Warning for common cm mistake
                         r = pesoImc / Math.pow(estatura, 2);
                         unit = 'kg/m²';
                         break;
                     case 'pam': {
                         const pas = numVal('pas');
                         const pad = numVal('pad');
                         if (isNaN(pas) || pas <= 0) throw new Error("La Presión Sistólica (PAS) debe ser mayor a 0.");
                         if (isNaN(pad) || pad <= 0) throw new Error("La Presión Diastólica (PAD) debe ser mayor a 0.");
                         if (pas < pad) throw new Error("La presión sistólica (PAS) no puede ser menor que la diastólica (PAD).");
                         r = pad + (pas - pad) / 3;
                         unit = 'mmHg';
                         break;
                     }
                     case 'mixGlucosa': {
                         const targetVol = numVal('targetVolGlucosa');
                         const targetPct = numVal('targetPctGlucosa');
                         const baseKey = $('baseSelGlucosa')?.value;
                         const concKey = $('concSelGlucosa')?.value;
                         if (isNaN(targetVol) || targetVol <= 0) throw new Error("Volumen final debe ser > 0.");
                         if (isNaN(targetPct) || targetPct < 0) throw new Error("Porcentaje objetivo no puede ser negativo.");
                         if (!baseKey || !glucoseBaseSolutions[baseKey]) throw new Error("Seleccione solución base válida.");
                         if (!concKey || !glucoseConcSolutions[concKey]) throw new Error("Seleccione solución concentrada válida.");

                         const basePct = glucoseBaseSolutions[baseKey].pct;
                         const concPct = glucoseConcSolutions[concKey].pct;

                         if (concPct === basePct) throw new Error("Las concentraciones base y concentrada no pueden ser iguales.");

                         const tolerance = 1e-9; // Tolerance for floating point comparison
                         if (targetPct > Math.max(basePct, concPct) + tolerance || targetPct < Math.min(basePct, concPct) - tolerance) {
                             throw new Error(`El porcentaje objetivo (${targetPct}%) debe estar entre el base (${basePct}%) y el concentrado (${concPct}%).`);
                         }

                         // Handle cases where target is exactly base or concentrated
                         if (Math.abs(targetPct - basePct) < tolerance) {
                              r = `Volumen Base (${glucoseBaseSolutions[baseKey].name}): ${round(targetVol)} mL\nVolumen Concentrado (${glucoseConcSolutions[concKey].name}): 0 mL`;
                         } else if (Math.abs(targetPct - concPct) < tolerance) {
                              r = `Volumen Base (${glucoseBaseSolutions[baseKey].name}): 0 mL\nVolumen Concentrado (${glucoseConcSolutions[concKey].name}): ${round(targetVol)} mL`;
                         } else {
                              // Standard calculation
                              const volConc = targetVol * (targetPct - basePct) / (concPct - basePct);
                              const volBase = targetVol - volConc;

                              // Check for calculation errors leading to negative volumes (shouldn't happen with range check, but safety first)
                              if (volConc < -tolerance || volBase < -tolerance) {
                                  console.error("Error in mix calculation: Negative volume calculated.", {targetVol, targetPct, basePct, concPct, volConc, volBase});
                                  throw new Error("Error en cálculo de mezcla, volúmenes negativos. Verifique las concentraciones.");
                              }
                              r = `Volumen Base (${glucoseBaseSolutions[baseKey].name}): ${round(Math.max(0, volBase))} mL\nVolumen Concentrado (${glucoseConcSolutions[concKey].name}): ${round(Math.max(0, volConc))} mL`;
                         }
                         unit = ''; // Result is a string description
                         break;
                     }
                     case 'gir': {
                         const flujo = numVal('flujoGir');
                         const conc = numVal('concGir');
                         const peso = numVal('pesoGir');
                         if (isNaN(flujo) || flujo < 0) throw new Error("El flujo no puede ser negativo.");
                         if (isNaN(conc) || conc < 0) throw new Error("La concentración no puede ser negativa.");
                         if (isNaN(peso) || peso <= 0) throw new Error("El peso debe ser mayor a 0.");
                          if (peso * 6 === 0) throw new Error("El peso no puede ser cero para calcular GIR.");
                         r = (flujo * conc) / (peso * 6);
                         unit = 'mg/kg/min';
                         break;
                     }
                     case 'volGlucosa': {
                         const gramos = numVal('gramosGlucosa');
                         const conc = numVal('concVolGlucosa');
                         if (isNaN(gramos) || gramos <= 0) throw new Error("Los gramos necesarios deben ser > 0.");
                         if (isNaN(conc) || conc <= 0) throw new Error("La concentración disponible debe ser > 0.");
                         r = gramos * 100 / conc;
                         unit = 'mL';
                         break;
                     }
                     case 'mix':
                         r = calcMix(); // calcMix returns a string or throws an error
                         unit = '';
                         break;
                     case 'dosisVol': {
                         let dosisReq = numVal('dosisReq');
                         let concentracion = numVal('concentracion');
                         const dosisUnidad = $('dosisReqUnidad')?.value;
                         const concUnidadSelect = $('concentracionUnidad');
                         const concUnidad = concUnidadSelect?.value;

                         if (isNaN(dosisReq)) throw new Error("Ingrese una Dosis Requerida válida.");
                         if (isNaN(concentracion)) throw new Error("Ingrese una Concentración válida.");
                         if (concentracion === 0) throw new Error("La concentración no puede ser 0.");
                         if (concentracion < 0) throw new Error("La concentración no puede ser negativa."); // Allow positive dose
                         if (!dosisUnidad || !concUnidad || !concUnidad.includes('/')) throw new Error("Unidades de dosis o concentración inválidas.");

                         const baseDosisUnidad = dosisUnidad;
                         const baseConcUnidadParts = concUnidad.split('/');
                         const baseConcUnidad = baseConcUnidadParts[0]; // e.g., 'mg' from 'mg/mL'
                         const volConcUnidad = baseConcUnidadParts[1]; // e.g., 'mL' from 'mg/mL'

                          if (!baseConcUnidad || !volConcUnidad) throw new Error("Unidad de concentración inválida.");

                         // Unit conversion
                         if (baseDosisUnidad === baseConcUnidad) {
                             // Units match, no conversion needed
                         } else if (baseDosisUnidad === 'mg' && baseConcUnidad === 'mcg') {
                             concentracion = concentracion / 1000; // Convert concentration to mg/mL
                         } else if (baseDosisUnidad === 'mcg' && baseConcUnidad === 'mg') {
                             concentracion = concentracion * 1000; // Convert concentration to mcg/mL
                         } else if (baseDosisUnidad === 'U' && baseConcUnidad === 'U') {
                              // Units match
                         }
                         else {
                              // Check if compatible units were selected (e.g., prevent mg / U/mL)
                              if((baseDosisUnidad === 'mg' || baseDosisUnidad === 'mcg') && baseConcUnidad === 'U') {
                                   throw new Error(`Unidades incompatibles: No se puede dividir ${dosisUnidad} entre ${concUnidad}.`);
                              }
                              if(baseDosisUnidad === 'U' && (baseConcUnidad === 'mg' || baseConcUnidad === 'mcg')) {
                                   throw new Error(`Unidades incompatibles: No se puede dividir ${dosisUnidad} entre ${concUnidad}.`);
                              }
                             // If units didn't match but were convertible, the conversion happened above.
                             // If they are fundamentally different (like mg vs U), throw error.
                             // This else might catch unexpected unit combinations if more are added later.
                             console.warn(`Potentially incompatible units, proceeding: ${dosisUnidad} / (${concUnidad})`);
                         }

                         r = dosisReq / concentracion;
                         unit = volConcUnidad; // Volume unit from concentration (usually mL)
                         break;
                     }
                     case 'dosisPeso': {
                         const dosisPrescrita = numVal('dosisPrescrita');
                         const pesoDosis = numVal('pesoDosis');
                         const dosisUnidad = $('dosisPrescritaUnidad')?.value;

                         if (isNaN(dosisPrescrita)) throw new Error("Ingrese una Dosis Prescrita válida.");
                         if (isNaN(pesoDosis) || pesoDosis <= 0) throw new Error("El peso debe ser mayor a 0.");
                         if (!dosisUnidad) throw new Error("Seleccione unidad de dosis prescrita.");

                         r = dosisPrescrita * pesoDosis;

                         if (dosisUnidad === 'mg/kg') unit = 'mg (dosis total)';
                         else if (dosisUnidad === 'mcg/kg') unit = 'mcg (dosis total)';
                         else unit = 'unidad (dosis total)'; // Fallback
                         break;
                     }
                     case 'convMgMcg': {
                         const valor = numVal('valorMgMcg');
                         const direccion = $('dirMgMcg')?.value;
                         if (isNaN(valor)) throw new Error("Ingrese un valor numérico válido.");
                         if (!direccion) throw new Error("Seleccione dirección de conversión.");

                         if (direccion === 'mg_mcg') { r = valor * 1000; unit = 'mcg'; }
                         else if (direccion === 'mcg_mg') { r = valor / 1000; unit = 'mg'; }
                         else { throw new Error("Dirección de conversión inválida."); }
                         break;
                     }
                     case 'convGMg': {
                         const valor = numVal('valorGMg');
                         const direccion = $('dirGMg')?.value;
                         if (isNaN(valor)) throw new Error("Ingrese un valor numérico válido.");
                         if (!direccion) throw new Error("Seleccione dirección de conversión.");

                         if (direccion === 'g_mg') { r = valor * 1000; unit = 'mg'; }
                         else if (direccion === 'mg_g') { r = valor / 1000; unit = 'g'; }
                         else { throw new Error("Dirección de conversión inválida."); }
                         break;
                     }
                     case 'velocidadInf': {
                         const volTotal = numVal('volTotalInf');
                         const tiempoHr = numVal('tiempoHrInf');
                         if (isNaN(volTotal) || volTotal < 0) throw new Error("El volumen no puede ser negativo.");
                         if (isNaN(tiempoHr) || tiempoHr <= 0) throw new Error("El tiempo debe ser mayor a 0 horas.");
                         r = volTotal / tiempoHr;
                         unit = 'mL/hr';
                         break;
                     }
                     case 'calculoGoteo': {
                         const volTotal = numVal('volTotalGoteo');
                         const tiempoMin = numVal('tiempoMinGoteo');
                         const factorGoteo = numVal('factorGoteo');
                         if (isNaN(volTotal) || volTotal < 0) throw new Error("El volumen no puede ser negativo.");
                         if (isNaN(tiempoMin) || tiempoMin <= 0) throw new Error("El tiempo debe ser mayor a 0 minutos.");
                         if (isNaN(factorGoteo) || factorGoteo <= 0) throw new Error("Factor de goteo inválido.");
                          if (tiempoMin === 0) throw new Error("El tiempo no puede ser cero para calcular goteo.");
                         r = Math.round((volTotal * factorGoteo) / tiempoMin);
                         unit = 'gotas/min';
                         break;
                     }
                     default:
                         throw new Error("Tipo de cálculo no reconocido.");
                 }

                 // --- Display Result ---
                 resultDiv.style.color = '#2d3748'; // Reset color for success
                 let resultText = '';
                 if (typeof r === 'number') {
                     if (isNaN(r)) {
                         throw new Error("Resultado inválido (NaN). Verifique los datos ingresados.");
                     }
                      // Avoid very small exponential numbers unless necessary
                     const formattedResult = Math.abs(r) < 1e-6 && r !== 0 ? r.toExponential(2) : round(r);
                     resultText = `Resultado: ${formattedResult} ${unit}`;
                 } else if (typeof r === 'string') {
                     // Used for mix results which are descriptive strings
                     resultText = `Resultado:\n${r}`; // Preserve newlines from mix calc
                 } else {
                     throw new Error("Tipo de resultado inesperado.");
                 }
                 resultDiv.innerHTML = `<div>${resultText.replace(/\n/g, '<br>')}</div>`; // Use <br> for display

            } catch (e) {
                 console.error("Error en cálculo:", e);
                 resultDiv.innerHTML = `<div style="color: #c53030; font-weight: bold;">Error: ${e.message || 'Datos inválidos o incompletos.'}</div>`;
                 resultDiv.style.color = '#c53030';
            }
        };

        // Specific function for saline mix calculation
        function calcMix() {
            const tipo = $("objetivoTipo")?.value;
            const v = numVal('targetVol'); // Final volume in mL

            if (isNaN(v) || v <= 0) throw new Error('Volumen final debe ser mayor a 0.');

            // --- Get Base Solution ---
            let base;
            const baseKey = $('baseSel')?.value;
            if (baseKey === 'custom') {
                 const customPct = numVal('customBasePct');
                 if (isNaN(customPct) || customPct < 0) throw new Error("Porcentaje de NaCl base personalizado inválido (<0).");
                 base = { name: `Base Personalizada (${customPct}%)`, mEqNa: pct2meq(customPct) };
             } else if (baseKey && baseSolutions[baseKey]) {
                 base = baseSolutions[baseKey];
             } else {
                 throw new Error("Seleccione una solución base válida.");
             }

            // --- Get Concentrated Solution ---
             let c; // Concentrated solution object
             const concKey = $('concSel')?.value;
             if (concKey === 'custom') {
                 const customVol = numVal('customConcVol'); // Volume of custom ampoule/unit in mL
                 const customPct = numVal('customConcPct'); // % NaCl (p/V) of custom concentrate
                 if (isNaN(customVol) || customVol <= 0) throw new Error("Volumen de ampolla/unidad concentrada personalizada debe ser > 0.");
                 if (isNaN(customPct) || customPct <= 0) throw new Error("Porcentaje de NaCl concentrado personalizado debe ser > 0.");

                 const mEqL = pct2meq(customPct); // mEq/L in the custom concentrate
                 c = {
                     name: `Concentrado Personalizado (${customPct}%, ${customVol}mL)`,
                     mEqNaAmp: mEqL * customVol / 1000, // Total mEq Na+ in one ampoule/unit
                     volAmp: customVol // Volume of one ampoule/unit in mL
                 };
                 if (isNaN(c.mEqNaAmp) || c.mEqNaAmp < 0) throw new Error("mEq calculados para concentrado personalizado son inválidos.");
             } else if (concKey && concSolutions[concKey]) {
                 c = concSolutions[concKey];
             } else {
                 throw new Error("Seleccione una solución concentrada válida.");
             }

             // Concentration of the concentrated solution in mEq/L
             const concMeqL = (c.volAmp > 0) ? (c.mEqNaAmp / c.volAmp * 1000) : 0;
             if (isNaN(concMeqL)) throw new Error("Concentración (mEq/L) del concentrado es inválida.");

             // --- Determine Target Total mEq Na+ ---
             let targetMeqTotal;
             if (tipo === 'conc') {
                 const targetConc = numVal('targetConc'); // Target mEq/L
                 if (isNaN(targetConc) || targetConc < 0) throw new Error("Concentración deseada (mEq/L) inválida.");
                 targetMeqTotal = targetConc * v / 1000;
             } else if (tipo === 'total') {
                 targetMeqTotal = numVal('targetMeq'); // Target total mEq
                 if (isNaN(targetMeqTotal) || targetMeqTotal < 0) throw new Error("mEq Na⁺ totales deseados inválidos.");
             } else { // Default to 'percent'
                 const p = numVal('targetPercent'); // Target % NaCl (p/V)
                 if (isNaN(p) || p < 0) throw new Error('Porcentaje objetivo inválido.');
                 targetMeqTotal = pct2meq(p) * v / 1000;
             }

             if (targetMeqTotal === undefined || isNaN(targetMeqTotal) || targetMeqTotal < 0) {
                 throw new Error('Objetivo de Na⁺ inválido o no calculado.');
             }

             // --- Validate Target Achievability ---
             const minPossibleConc = Math.min(base.mEqNa, concMeqL);
             const maxPossibleConc = Math.max(base.mEqNa, concMeqL);
             const targetConcForValidation = targetMeqTotal / v * 1000;
             const tolerance = 1e-9; // Tolerance for float comparisons

             if (targetConcForValidation > maxPossibleConc + tolerance) {
                 throw new Error(`Concentración objetivo (${round(targetConcForValidation)} mEq/L) es mayor que la máxima posible con estas soluciones (${round(maxPossibleConc)} mEq/L).`);
             }
             if (targetConcForValidation < minPossibleConc - tolerance) {
                 throw new Error(`Concentración objetivo (${round(targetConcForValidation)} mEq/L) es menor que la mínima posible con estas soluciones (${round(minPossibleConc)} mEq/L).`);
             }

             // Check for illogical requests (e.g., target higher than base, but concentrate is lower than base)
             if (base.mEqNa > concMeqL + tolerance && targetConcForValidation > base.mEqNa + tolerance) {
                 throw new Error(`Objetivo (${round(targetConcForValidation)} mEq/L) es mayor que la base (${round(base.mEqNa)} mEq/L) pero el 'concentrado' elegido (${round(concMeqL)} mEq/L) es aún MENOR que la base.`);
             }
              // Check reverse illogical request
             if (concMeqL > base.mEqNa + tolerance && targetConcForValidation < base.mEqNa - tolerance) {
                  throw new Error(`Objetivo (${round(targetConcForValidation)} mEq/L) es menor que la base (${round(base.mEqNa)} mEq/L) pero el 'concentrado' elegido (${round(concMeqL)} mEq/L) es MAYOR que la base.`);
             }

             // --- Find Best Combination ---
             // Iterate through number of ampoules to find the closest match
             let bestMatch = { diff: Infinity, numAmpollas: 0, volBase: 0, totalMeqReal: 0 };
             // Max ampoules to check: enough to replace entire volume + a buffer
             const maxAmpollas = c.volAmp > 0 ? Math.ceil(v / c.volAmp) + 10 : 1;

             for (let n = 0; n <= maxAmpollas; n++) {
                 const volAmpTotal = n * c.volAmp; // Total volume contributed by ampoules
                 const volBaseActual = v - volAmpTotal; // Remaining volume needed from base

                 // If adding this many ampoules exceeds the target volume, we might still consider it if it's the closest match so far,
                 // but typically we stop or have found the best match earlier.
                 // Let's allow slightly negative base volume due to float issues, but stop significant overshoot.
                 if (volBaseActual < -tolerance && n > 0) { // If base vol goes negative, stop unless it's the first check (n=0)
                    if (bestMatch.diff !== Infinity) break; // Stop if we already have a valid match
                     continue; // Skip this iteration if it's the first check and base is negative
                 }


                 const meqFromAmp = n * c.mEqNaAmp; // Total mEq from n ampoules
                 // Total mEq from base solution (ensure base volume isn't negative)
                 const meqFromBase = base.mEqNa * Math.max(0, volBaseActual) / 1000;

                 const meqTotalActual = meqFromAmp + meqFromBase; // Total mEq in the mix
                 const diff = Math.abs(meqTotalActual - targetMeqTotal); // Difference from target

                 // If this combination is better than the current best, update bestMatch
                 if (diff < bestMatch.diff - tolerance) {
                     bestMatch = {
                         diff: diff,
                         numAmpollas: n,
                         volBase: Math.max(0, volBaseActual), // Don't report negative base volume
                         totalMeqReal: meqTotalActual
                     };
                 }

                 // Optimization: If we found a near-perfect match, stop searching
                 if (diff < 1e-6) break;
             }

             if (bestMatch.diff === Infinity) {
                 // This should ideally not happen with the validation checks above
                 throw new Error('No se encontró una combinación válida. Verifique los volúmenes, concentraciones y objetivos.');
             }

             // --- Format Output String ---
             const concReal = bestMatch.totalMeqReal / v * 1000; // Actual final concentration in mEq/L
             const pctReal = concReal * 58.5 / 10000; // Actual final concentration in % NaCl p/V
             const baseNameForResult = baseKey === 'custom' ? base.name : `${base.name}`;
             const concNameForResult = concKey === 'custom' ? c.name : `${c.name}`;
             const totalVolAmpollas = bestMatch.numAmpollas * c.volAmp;

             let resultString = `Utilizar:\n`;
             resultString += `  • Ampollas/Unidades: ${bestMatch.numAmpollas} × ${c.volAmp} mL (${concNameForResult})\n`;
             resultString += `      (Total en ampollas: ${round(totalVolAmpollas)} mL)\n`;
             resultString += `  • Solución Base: ${round(bestMatch.volBase)} mL (${baseNameForResult})\n`;
             resultString += `-----\n`;
             resultString += `Resultado Estimado:\n`;
             resultString += `  • Volumen Total: ${round(bestMatch.volBase + totalVolAmpollas)} mL (Objetivo: ${round(v)} mL)\n`;
             resultString += `  • Na⁺ Totales: ${round(bestMatch.totalMeqReal)} mEq (Objetivo: ${round(targetMeqTotal)} mEq)\n`;
             resultString += `  • Concentración Final: ${round(concReal)} mEq/L\n`;
             resultString += `      (Equivalente a ≈ ${round(pctReal, 2)}% NaCl p/V)\n`;

             // Simplified summary section removed as details are above.

             return resultString;
         }

        // Initialize the first view
        renderInputs();

    })(); // End of calculator IIFE


    // --- NANDA SCRIPT (IIFE Wrapper) ---
    (function() {

        // --- Diccionario de Sinónimos (TRUNCADO) ---
        const diccionarioSinonimos = {
            "acolia": ["acolia", "heces blancas", "popo blanco", "excremento sin color"],
            "acufenos": ["acufenos", "tinnitus", "zumbido de oidos", "pitido en oidos", "ruido en oidos"],
            "adenopatia": ["adenopatia", "ganglio inflamado", "bolita en cuello", "bolita en axila", "bolita en ingle", "linfonodo inflamado"],
            "adinamia": ["adinamia", "falta de fuerza", "debilidad extrema", "sin ganas de moverse"],
            "agruras": ["agruras", "acidez", "pirosis", "vinagreras", "fuego en el estomago"],
            "alopecia": ["alopecia", "caida de cabello", "perdida de pelo", "calvicie"],
            "amenorrea": ["amenorrea", "falta de regla", "ausencia de menstruacion", "no me baja"],
            "anorexia": ["anorexia", "falta de apetito", "no tener hambre", "sin ganas de comer"],
            "anosmia": ["anosmia", "perdida de olfato", "no oler"],
            "anuria": ["anuria", "no orinar", "sin produccion de orina"],
            "apnea": ["apnea", "pausa respiratoria", "dejar de respirar"],
            "artralgia": ["artralgia", "dolor de articulaciones", "dolor de coyunturas", "me duelen las articulaciones"],
            "astenia": ["astenia", "cansancio general", "debilidad", "fatiga", "falta de energia"],
            "ataxia": ["ataxia", "descoordinacion", "movimientos torpes", "falta de equilibrio al moverse"],
            "borborigmos": ["borborigmos", "ruidos intestinales", "ruido de tripas", "me suenan las tripas"],
            "bradicardia": ["bradicardia", "pulso bajo", "frecuencia cardiaca lenta", "corazon lento"],
            "bradipnea": ["bradipnea", "respiracion lenta"],
            "cefalea": ["cefalea", "dolor de cabeza", "jaqueca", "migraña"],
            "cianosis": ["cianosis", "color azulado", "piel morada", "labios azules", "uñas azules"],
            "claudicacion intermitente": ["claudicacion intermitente", "dolor al caminar", "dolor de piernas al andar", "calambres al caminar"],
            "coluria": ["coluria", "orina oscura", "orina como coca-cola", "orina cafe"],
            "confusion": ["confusion", "desorientacion", "no saber donde esta", "estar perdido", "no saber que dia es"],
            "convulsiones": ["convulsiones", "ataques", "crisis convulsivas", "temblores fuertes", "perder el conocimiento y temblar"],
            "diaforesis": ["diaforesis", "sudoracion excesiva", "transpiracion abundante", "sudar mucho"],
            "diarrea": ["diarrea", "chorro", "soltura", "evacuaciones liquidas", "hacer aguado", "cagalera", "tener el estomago suelto"],
            "diplopia": ["diplopia", "vision doble", "ver doble"],
            "disartria": ["disartria", "dificultad para hablar", "habla arrastrada", "no poder articular bien"],
            "disfagia": ["disfagia", "dificultad para tragar", "dificultad para pasar comida", "atorarse al comer"],
            "dismenorrea": ["dismenorrea", "dolor de regla", "dolor menstrual", "colicos menstruales"],
            "disnea": ["disnea", "falta de aire", "dificultad para respirar", "ahogo", "no poder respirar bien", "respiracion corta"],
            "distension abdominal": ["distension abdominal", "abdomen hinchado", "panza inflada", "vientre abultado", "sentirse embarado"],
            "disuria": ["disuria", "dolor al orinar", "ardor al orinar", "molestia al hacer pipi"],
            "edema": ["edema", "hinchazon", "inflamacion", "retencion de liquidos", "estar hinchado"],
            "emesis": ["emesis", "vomito", "devolver el estomago", "arrojar", "basca"],
            "epistaxis": ["epistaxis", "sangrado nasal", "hemorragia nasal", "sangre por la nariz"],
            "eritema": ["eritema", "enrojecimiento", "piel roja", "chapeado"],
            "escalofrios": ["escalofrios", "temblores de frio", "sentir frio y temblar"],
            "esputo": ["esputo", "flema", "gargajo", "expectoracion"],
            "estrenimiento": ["estrenimiento", "constipacion", "no poder obrar", "no poder evacuar", "estar tapado", "no hacer popo"],
            "estridor": ["estridor", "ruido al respirar", "silbido agudo al respirar", "respiracion ruidosa"],
            "expectoracion": ["expectoracion", "flemas", "sacar flemas", "gargajo"],
            "fatiga": ["fatiga", "cansancio extremo", "agotamiento", "falta de energia", "sensacion de pesadez"],
            "fiebre": ["fiebre", "temperatura alta", "calentura", "hipertermia", "tener temperatura"],
            "flatulencia": ["flatulencia", "gases", "pedos", "aire en el estomago"],
            "fotofobia": ["fotofobia", "molestia a la luz", "sensibilidad a la luz", "no aguantar la luz"],
            "gingivorragia": ["gingivorragia", "sangrado de encias", "encias sangrantes"],
            "halitosis": ["halitosis", "mal aliento"],
            "hematemesis": ["hematemesis", "vomito con sangre", "arrojar sangre"],
            "hematoma": ["hematoma", "moreton", "cardenal", "chipote", "golpe morado"],
            "hematuria": ["hematuria", "sangre en la orina", "orinar sangre"],
            "hemoptisis": ["hemoptisis", "tos con sangre", "escupir sangre", "flema con sangre"],
            "hemorragia": ["hemorragia", "sangrado abundante", "perdida de sangre"],
            "hiperglucemia": ["hiperglucemia", "azucar alta", "glucosa alta"],
            "hipertension": ["hipertension", "presion alta"],
            "hipertermia": ["hipertermia", "fiebre", "temperatura alta", "calentura"],
            "hipersomnia": ["hipersomnia", "mucho sueño", "dormir demasiado"],
            "hipoacusia": ["hipoacusia", "disminucion de audicion", "no oir bien", "sordera leve"],
            "hipoglucemia": ["hipoglucemia", "azucar baja", "glucosa baja"],
            "hipotension": ["hipotension", "presion baja"],
            "hipotermia": ["hipotermia", "temperatura baja", "enfriamiento"],
            "hipoxemia": ["hipoxemia", "falta de oxigeno en sangre", "oxigeno bajo"],
            "ictericia": ["ictericia", "piel amarilla", "ojos amarillos", "ponerse amarillo"],
            "incontinencia": ["incontinencia", "no aguantar", "escape involuntario", "se le sale"],
            "insomnio": ["insomnio", "no poder dormir", "dificultad para dormir", "desvelarse"],
            "inquietud": ["inquietud", "nerviosismo", "no poder estar quieto", "intranquilidad"],
            "letargia": ["letargia", "adormilado", "somnoliento", "dificil de despertar", "muy apagado"],
            "leucorrea": ["leucorrea", "flujo blanco", "secrecion vaginal blanca"],
            "lipotimia": ["lipotimia", "desmayo", "desvanecimiento", "vahido", "irsele las luces"],
            "malestar general": ["malestar general", "sentirse mal", "cuerpo cortado", "achacoso"],
            "mareo": ["mareo", "vahido", "sentirse güilo", "aturdimiento"],
            "melena": ["melena", "heces negras", "popo negro como chapopote", "evacuaciones negras"],
            "mialgia": ["mialgia", "dolor muscular", "dolor de cuerpo", "musculos adoloridos"],
            "midriasis": ["midriasis", "pupilas dilatadas"],
            "miosis": ["miosis", "pupilas pequeñas", "pupilas contraidas"],
            "nauseas": ["nauseas", "asco", "ganas de vomitar", "basca", "sentirse revuelto"],
            "nicturia": ["nicturia", "levantarse a orinar en la noche", "orinar de noche"],
            "odinofagia": ["odinofagia", "dolor al tragar", "dolor al pasar comida"],
            "oliguria": ["oliguria", "orinar poco", "disminucion de orina"],
            "palidez": ["palidez", "estar palido", "piel blanca", "sin color"],
            "palpitaciones": ["palpitaciones", "sentir el corazon rapido", "brincos en el corazon", "corazon acelerado"],
            "paresia": ["paresia", "debilidad muscular", "falta de fuerza parcial"],
            "parestesias": ["parestesias", "hormigueo", "entumecimiento", "piquetitos", "sentir dormido"],
            "petequias": ["petequias", "puntitos rojos en la piel", "manchitas rojas"],
            "pirosis": ["pirosis", "agruras", "acidez estomacal", "ardor en el estomago"],
            "polaquiuria": ["polaquiuria", "orinar a cada rato", "micciones frecuentes", "ir mucho al baño a orinar poco"],
            "polidipsia": ["polidipsia", "mucha sed", "sed excesiva"],
            "polifagia": ["polifagia", "mucha hambre", "comer mucho"],
            "poliuria": ["poliuria", "orinar mucho", "gran cantidad de orina"],
            "prurito": ["prurito", "picazon", "comezon", "rasquiña"],
            "rectorragia": ["rectorragia", "sangre roja por el ano", "sangrado rectal"],
            "regurgitacion": ["regurgitacion", "regresar la comida", "se le regresa la leche"],
            "rinorrea": ["rinorrea", "escozor nasal", "moco liquido", "nariz que escurre"],
            "sibilancias": ["sibilancias", "silbidos en el pecho", "pecho que silba", "respiracion con pitido"],
            "sincope": ["sincope", "desmayo", "perdida de conocimiento", "desvanecimiento"],
            "somnolencia": ["somnolencia", "sueño excesivo", "andar adormilado", "ganas de dormir"],
            "taquicardia": ["taquicardia", "corazon rapido", "pulso alto", "frecuencia cardiaca rapida", "palpitaciones"],
            "taquipnea": ["taquipnea", "respiracion rapida", "respirar muy rapido"],
            "temblor": ["temblor", "temblorina", "estar temblando"],
            "tenesmo": ["tenesmo", "sensacion de querer evacuar/orinar sin poder", "quedarse con ganas", "pujo"],
            "tos": ["tos", "carraspera"],
            "urticaria": ["urticaria", "ronchas", "habones", "picazon con ronchas"],
            "vertigo": ["vertigo", "mareo giratorio", "sentir que todo da vueltas", "sentirse mareado como borracho"],
            "vomito": ["vomito", "emesis", "arrojar", "devolver", "basca"],
            "xerostomia": ["xerostomia", "boca seca", "falta de saliva"]
            // ... (rest of synonyms)
        };

        // --- Categorías NANDA (Map ID to Domain - TRUNCADO) ---
        const categoriasNANDA = {
           // Dominio 1: Promoción de la salud
            "00078": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
            "00079": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
            "00080": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
            "00081": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
            "00084": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
            "00099": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
            "00162": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
            "00186": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
            "00188": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
            "00215": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
            "00262": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
            "00276": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
            "00277": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
            "00278": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
            "00281": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
            "00292": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
            "00293": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
            "00294": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
            "00296": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
            "00307": { dominioNum: 1, dominioNombre: "Promoción de la salud" },

            // Dominio 2: Nutrición
            "00001": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00002": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00003": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00025": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00026": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00027": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00028": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00101": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00104": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00105": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00106": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00107": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00160": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00163": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00179": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00195": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00216": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00232": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00233": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00234": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00269": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00270": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00271": { dominioNum: 2, dominioNombre: "Nutrición" },
            "00295": { dominioNum: 2, dominioNombre: "Nutrición" },

            // Dominio 3: Eliminación e intercambio
            "00011": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00012": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00013": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00014": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00015": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00016": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00017": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00018": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00019": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00020": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00021": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00022": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00023": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00030": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00166": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00176": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00196": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00197": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00202": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" }, // Ojo: Estaba en Dominio 4 antes, pero la lista lo pone aquí
            "00203": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" }, // Ojo: Estaba en Dominio 4 antes, pero la lista lo pone aquí
            "00235": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00236": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00297": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00310": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00319": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
            "00322": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },

            // Dominio 4: Actividad/Reposo
            "00024": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00029": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00032": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00033": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00034": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00040": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00049": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00085": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00088": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00089": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00090": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00091": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00092": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00093": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00094": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00095": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00096": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00097": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00102": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00108": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00109": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00110": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00165": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00168": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00182": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00193": { dominioNum: 4, dominioNombre: "Actividad/Reposo" }, // Ojo: Estaba en Dominio 7 antes, pero la lista lo pone aquí
            "00198": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00200": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00201": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00204": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00228": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00237": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00238": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00240": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00267": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00298": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00299": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00311": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
            "00318": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },

            // Dominio 5: Percepción/Cognición
            "00051": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
            "00122": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
            "00123": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
            "00126": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
            "00127": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
            "00128": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
            "00129": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
            "00130": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
            "00131": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
            "00154": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
            "00157": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
            "00161": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
            "00173": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
            "00199": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
            "00226": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
            "00279": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },

            // Dominio 6: Autopercepción
            "00118": { dominioNum: 6, dominioNombre: "Autopercepción" },
            "00119": { dominioNum: 6, dominioNombre: "Autopercepción" },
            "00120": { dominioNum: 6, dominioNombre: "Autopercepción" },
            "00121": { dominioNum: 6, dominioNombre: "Autopercepción" },
            "00124": { dominioNum: 6, dominioNombre: "Autopercepción" },
            "00125": { dominioNum: 6, dominioNombre: "Autopercepción" },
            "00152": { dominioNum: 6, dominioNombre: "Autopercepción" },
            "00153": { dominioNum: 6, dominioNombre: "Autopercepción" },
            "00167": { dominioNum: 6, dominioNombre: "Autopercepción" },
            "00185": { dominioNum: 6, dominioNombre: "Autopercepción" },
            "00187": { dominioNum: 6, dominioNombre: "Autopercepción" },
            "00224": { dominioNum: 6, dominioNombre: "Autopercepción" },
            "00225": { dominioNum: 6, dominioNombre: "Autopercepción" },

            // Dominio 7: Rol/Relaciones
            "00052": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00054": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00055": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00056": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00057": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00058": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00060": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00061": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00062": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00063": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00064": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00098": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00159": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00164": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00207": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00208": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00221": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00223": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00227": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00229": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00283": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00284": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00300": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00308": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
            "00309": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },

            // Dominio 8: Sexualidad
            "00059": { dominioNum: 8, dominioNombre: "Sexualidad" },
            "00065": { dominioNum: 8, dominioNombre: "Sexualidad" },

            // Dominio 9: Afrontamiento/Tolerancia al estrés
            "00069": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00070": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00071": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00072": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00073": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00074": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00075": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00076": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00077": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00114": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00135": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00136": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00137": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00141": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00142": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00143": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00144": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00145": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00146": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00147": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00148": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00149": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00158": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00172": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00177": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00210": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00211": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00212": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00222": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00241": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00251": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00258": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00259": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00260": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00264": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00285": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00301": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
            "00302": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },

            // Dominio 10: Principios vitales
            "00050": { dominioNum: 10, dominioNombre: "Principios vitales" },
            "00066": { dominioNum: 10, dominioNombre: "Principios vitales" },
            "00067": { dominioNum: 10, dominioNombre: "Principios vitales" },
            "00068": { dominioNum: 10, dominioNombre: "Principios vitales" },
            "00083": { dominioNum: 10, dominioNombre: "Principios vitales" },
            "00169": { dominioNum: 10, dominioNombre: "Principios vitales" },
            "00170": { dominioNum: 10, dominioNombre: "Principios vitales" },
            "00171": { dominioNum: 10, dominioNombre: "Principios vitales" },
            "00174": { dominioNum: 10, dominioNombre: "Principios vitales" },
            "00175": { dominioNum: 10, dominioNombre: "Principios vitales" },
            "00184": { dominioNum: 10, dominioNombre: "Principios vitales" },
            "00242": { dominioNum: 10, dominioNombre: "Principios vitales" },
            "00243": { dominioNum: 10, dominioNombre: "Principios vitales" },
            "00244": { dominioNum: 10, dominioNombre: "Principios vitales" },
            "00273": { dominioNum: 10, dominioNombre: "Principios vitales" },

            // Dominio 11: Seguridad/Protección
            "00004": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00005": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00006": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00007": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00008": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00009": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00010": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00031": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00035": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00036": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00037": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00038": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00039": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00041": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00042": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00043": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00044": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00045": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00046": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00047": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00048": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00086": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00087": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00100": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00103": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00138": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00139": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00140": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00150": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00151": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00155": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00156": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00178": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00180": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00181": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00205": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00206": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00209": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00213": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00217": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00218": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00219": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00220": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00231": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00245": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00246": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00247": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00248": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00250": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00253": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00254": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00257": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00261": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00265": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00266": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00272": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00274": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00280": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00282": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00286": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00287": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00288": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00289": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00290": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00291": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00303": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00304": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00306": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00312": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00313": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00320": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
            "00321": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },

            // Dominio 12: Confort
            "00053": { dominioNum: 12, dominioNombre: "Confort" },
            "00132": { dominioNum: 12, dominioNombre: "Confort" }, // Added from user example
            "00133": { dominioNum: 12, dominioNombre: "Confort" },
            "00134": { dominioNum: 12, dominioNombre: "Confort" },
            "00183": { dominioNum: 12, dominioNombre: "Confort" },
            "00214": { dominioNum: 12, dominioNombre: "Confort" },
            "00255": { dominioNum: 12, dominioNombre: "Confort" },
            "00256": { dominioNum: 12, dominioNombre: "Confort" },

            // Dominio 13: Crecimiento/Desarrollo
            "00111": { dominioNum: 13, dominioNombre: "Crecimiento/Desarrollo" },
            "00112": { dominioNum: 13, dominioNombre: "Crecimiento/Desarrollo" },
            "00113": { dominioNum: 13, dominioNombre: "Crecimiento/Desarrollo" },
            "00115": { dominioNum: 13, dominioNombre: "Crecimiento/Desarrollo" },
            "00116": { dominioNum: 13, dominioNombre: "Crecimiento/Desarrollo" },
            "00117": { dominioNum: 13, dominioNombre: "Crecimiento/Desarrollo" },
            "00194": { dominioNum: 13, dominioNombre: "Crecimiento/Desarrollo" },
            "00230": { dominioNum: 13, dominioNombre: "Crecimiento/Desarrollo" },
            "00305": { dominioNum: 13, dominioNombre: "Crecimiento/Desarrollo" },
            "00314": { dominioNum: 13, dominioNombre: "Crecimiento/Desarrollo" },
            "00315": { dominioNum: 13, dominioNombre: "Crecimiento/Desarrollo" },
            "00316": { dominioNum: 13, dominioNombre: "Crecimiento/Desarrollo" }
            // ... (rest of categories)
        };

        // --- Base de datos NANDA (TRUNCADO - Solo 2 ejemplos) ---
        const nandaData = [
        {
                "id": "00132",
                "label": "Dolor agudo",
                "definicion": "Experiencia sensitiva y emocional desagradable, asociada con daño tisular real o potencial, de duración inferior a 3 meses.",
                "relacionadoCon": [
                    "Lesión física (trauma, cirugía, inflamación, quemaduras).",
                    "Procedimientos diagnósticos o terapéuticos.",
                    "Enfermedad aguda (como infecciones o cólicos).",
                    "Isquemia tisular."
                ],
                "manifestadoPor": [
                    "Informe verbal del paciente sobre la presencia de dolor (localización, intensidad, características). Uso de escalas de dolor.",
                    "Expresiones faciales (muecas, ceño fruncido).",
                    "Comportamiento de protección (posición antiálgica, defensa de la zona).",
                    "Agitación, inquietud o, por el contrario, inmovilidad temerosa.",
                    "Respuestas autonómicas (aumento de FC, TA, FR; diaforesis, palidez, dilatación pupilar) - pueden disminuir con dolor persistente.",
                    "Alteración del tono muscular.",
                    "Enfoque limitado, alteración de la percepción del tiempo. (Duración < 3-6 meses, inicio identificable)."
                ],
                "resultadosEsperados": [
                    "El paciente verbalizará una disminución del dolor en una escala del 0 al 10.",
                    "El paciente mostrará signos de confort (postura relajada, expresión facial tranquila).",
                    "El paciente participará en las actividades de cuidado y movilización."
                ],
                "intervenciones": [
                    "Valoración Exhaustiva del Dolor: Evaluar localización, calidad, intensidad (escala), tiempo, factores agravantes/aliviantes y impacto funcional. Reevaluar regularmente, especialmente tras intervenciones.",
                    "Administración de Analgesia Óptima: Administrar analgésicos prescritos (AINEs, opioides, paracetamol) según pauta y necesidad (pauta fija y rescates). Considerar analgesia multimodal. Evaluar eficacia y efectos secundarios.",
                    "Medidas No Farmacológicas: Aplicar frío/calor local (si indicado), masajes suaves (lejos de la zona si es herida), cambios posturales, técnicas de distracción (música, conversación), técnicas de relajación (respiración profunda).",
                    "Educación y Prevención: Informar al paciente sobre las causas del dolor y las opciones de manejo. Enseñar a usar la escala de dolor. Anticipar y prevenir el dolor (p. ej., analgesia antes de movilización o procedimientos dolorosos)."
                ]
            },
            {
                "id": "00133",
                "label": "Dolor crónico",
                "definicion": "Experiencia sensitiva y emocional desagradable ocasionada por una lesión tisular real o potencial, o descrita en tales términos (International Association for the Study of Pain); de inicio súbito o lento, de cualquier intensidad (de leve a grave), sin un final anticipado o previsible y con una duración superior a 3 meses.",
                "relacionadoCon": [
                    "Incapacidad física crónica (p. ej., por lesión antigua, artritis).",
                    "Incapacidad psicosocial crónica (p. ej., depresión, ansiedad que perpetúan el ciclo del dolor).",
                    "Lesión del sistema nervioso (p. ej., neuropatías).",
                    "Condiciones inflamatorias persistentes.",
                    "Isquemia tisular crónica.",
                    "Daño tisular mantenido (p. ej., por procesos degenerativos o tumorales)."
                ],
                "manifestadoPor": [
                    "Informe verbal del paciente sobre la persistencia del dolor (más de 3 meses).",
                    "Autoinforme de intensidad usando escalas estandarizadas (p. ej., EVA, numérica).",
                    "Expresión facial de dolor (p. ej., ceño fruncido constante, mirada triste o cansada, muecas).",
                    "Alteración en la habilidad para continuar con las actividades previas (laborales, sociales, recreativas).",
                    "Cambios en el patrón de sueño (dificultad para conciliar el sueño, despertares frecuentes).",
                    "Fatiga, falta de energía.",
                    "Anorexia o cambios en el apetito.",
                    "Conductas de protección o defensa de la zona afectada.",
                    "Irritabilidad, frustración, ansiedad, depresión.",
                    "Atención centrada en sí mismo y en el dolor.",
                    "Aislamiento social o disminución de la interacción.",
                    "Informes de personas cercanas sobre cambios en el comportamiento o actividad del paciente debido al dolor."
                ],
                "resultadosEsperados": [
                    "El paciente referirá que el dolor está controlado a un nivel igual o inferior a [especificar nivel tolerable en escala 0-10] durante [especificar tiempo]. (NOC 1605 Control del dolor)",
                    "El paciente describirá factores que alivian y exacerban su dolor. (NOC 1605)",
                    "El paciente utilizará estrategias farmacológicas y no farmacológicas apropiadas para manejar el dolor. (NOC 1605)",
                    "El paciente reportará una mejora en la calidad del sueño. (NOC 2102 Nivel del dolor - impacto en sueño)",
                    "El paciente mantendrá o mejorará su participación en actividades deseadas/necesarias. (NOC 2101 Dolor: efectos nocivos)",
                    "El paciente expresará sentimientos y utilizará estrategias de afrontamiento efectivas para manejar el impacto emocional del dolor. (NOC 1306 Dolor: respuesta psicológica adversa)"
                ],
                "intervenciones": [
                    "Valoración Integral del Dolor Crónico: Evaluar regularmente localización, características, intensidad, duración, factores desencadenantes/aliviantes e impacto en la función, sueño, ánimo y calidad de vida. Usar escalas validadas.",
                    "Manejo del Dolor (NIC 1400): Establecer un plan de manejo individualizado y multimodal. Combinar estrategias farmacológicas y no farmacológicas. Establecer metas realistas con el paciente.",
                    "Administración de Analgésicos (NIC 2210): Administrar medicación pautada (fija y/o rescate), evaluar eficacia y efectos secundarios. Educar sobre el uso correcto y seguro de los analgésicos.",
                    "Fomento de Técnicas No Farmacológicas: Enseñar y aplicar técnicas como relajación (respiración profunda, meditación), distracción (música, conversación), TENS (NIC 1540), aplicación de frío/calor si procede, ejercicio terapéutico adaptado, masajes suaves.",
                    "Apoyo Emocional (NIC 5270): Establecer una relación terapéutica de confianza. Escuchar activamente. Validar la experiencia del dolor del paciente. Permitir la expresión de sentimientos (ira, tristeza, frustración).",
                    "Aumentar el Afrontamiento (NIC 5230): Ayudar al paciente a identificar fortalezas y recursos. Fomentar estrategias de afrontamiento adaptativas. Ayudar a establecer metas realistas para mejorar la función y calidad de vida a pesar del dolor.",
                    "Educación Sanitaria: Informar al paciente y familia sobre la naturaleza del dolor crónico, opciones de tratamiento, manejo de efectos secundarios, y estrategias de autocuidado.",
                    "Manejo del Sueño: Evaluar patrón de sueño. Enseñar medidas de higiene del sueño. Coordinar pauta analgésica para minimizar dolor nocturno.",
                    "Fomento del Ejercicio: Desarrollar un plan de ejercicio suave y progresivo adaptado a las capacidades del paciente para mejorar la movilidad, reducir rigidez y mejorar el estado de ánimo.",
                    "Manejo Nutricional: Valorar estado nutricional y apetito. Ofrecer recomendaciones si hay anorexia o desequilibrio nutricional."
                ]
                },
                {
                "id": "00004",
                "label": "Riesgo de infección",
                "definicion": "Susceptible a la invasión y multiplicación de organismos patógenos, que puede comprometer la salud.",
                "relacionadoCon": [
                    "Procedimientos invasivos (catéteres venosos, sondas urinarias, cirugía).",
                    "Defensas primarias inadecuadas (piel rota, traumatismo tisular, estasis de líquidos corporales).",
                    "Defensas secundarias inadecuadas (inmunosupresión, leucopenia, respuesta inflamatoria suprimida).",
                    "Enfermedades crónicas (diabetes, EPOC, cáncer).",
                    "Malnutrición.",
                    "Conocimientos insuficientes para evitar la exposición a patógenos.",
                    "Exposición ambiental aumentada a patógenos (hospitalización prolongada, brotes comunitarios).",
                    "Vacunación inadecuada.",
                    "Rotura prematura o prolongada de membranas amnióticas."
                ],
                "manifestadoPor": [],
                "resultadosEsperados": [
                    "El paciente permanecerá libre de signos y síntomas de infección durante [especificar tiempo]. (NOC 1902 Control del riesgo)",
                    "El paciente identificará factores de riesgo de infección personales. (NOC 1843 Conocimiento: control de la infección)",
                    "El paciente demostrará conductas para prevenir la infección (p. ej., higiene de manos, cuidado de heridas). (NOC 1902)",
                    "El paciente mantendrá recuento leucocitario y constantes vitales dentro de límites normales."
                ],
                "intervenciones": [
                    "Control de Infecciones (NIC 6540): Aplicar precauciones universales/estándar. Mantener técnicas de asepsia para procedimientos invasivos. Lavado de manos riguroso.",
                    "Protección contra las Infecciones (NIC 6550): Vigilar signos y síntomas de infección sistémica y localizada (fiebre, taquicardia, leucocitosis, aspecto de heridas/sitios de inserción).",
                    "Cuidado del Sitio de Incisión (NIC 3440): Inspeccionar sitio de incisión/herida. Limpiar según protocolo. Enseñar al paciente/familia signos de infección de la herida.",
                    "Cuidado del Catéter Urinario (NIC 1876) / Cuidado del Catéter Venoso Central (NIC 4220) / Mantenimiento del Acceso Venoso Periférico (NIC 4190): Mantener sistema cerrado. Valorar sitio de inserción. Realizar cuidados según protocolo.",
                    "Enseñanza: Proceso de Enfermedad (NIC 5602): Educar sobre factores de riesgo y medidas preventivas.",
                    "Fomento de la Inmunización (NIC 5510): Verificar estado vacunal y administrar/recomendar vacunas según pauta.",
                    "Manejo de la Nutrición (NIC 1100): Asegurar ingesta adecuada de nutrientes para favorecer la respuesta inmune.",
                    "Vigilancia de la Piel (NIC 3590): Inspeccionar regularmente la piel en busca de soluciones de continuidad."
                ]
                },
                {
                "id": "00046",
                "label": "Deterioro de la integridad cutánea",
                "definicion": "Alteración de la epidermis y/o la dermis.",
                "relacionadoCon": [
                    "Factores externos: Humedad excesiva, cizallamiento, presión, fricción, extremos de temperatura, radiación, agentes químicos, factores mecánicos (restricciones, heridas quirúrgicas, adhesivos).",
                    "Factores internos: Alteración del estado nutricional (obesidad, delgadez extrema, déficit de vitaminas/proteínas), alteración de la circulación, alteración de la sensibilidad, alteración del estado metabólico, alteración del turgor cutáneo, prominencias óseas, factores inmunitarios, factores del desarrollo (edades extremas), alteración de la pigmentación.",
                    "Medicación.",
                    "Alteración de la movilidad."
                ],
                "manifestadoPor": [
                    "Destrucción de las capas de la piel (dermis, epidermis).",
                    "Lesión tisular (herida, úlcera, quemadura).",
                    "Invasión de estructuras corporales.",
                    "Eritema.",
                    "Hematoma.",
                    "Descamación."
                ],
                "resultadosEsperados": [
                    "El paciente mostrará curación de la herida/lesión cutánea. (NOC 1102 Curación de la herida: por primera intención / NOC 1103 Curación de la herida: por segunda intención)",
                    "El paciente mantendrá la integridad de la piel circundante a la lesión. (NOC 1101 Integridad tisular: piel y membranas mucosas)",
                    "El paciente o cuidador describirá el plan de cuidados para la herida/piel.",
                    "El paciente permanecerá libre de signos de infección en la herida."
                ],
                "intervenciones": [
                    "Cuidados de las Heridas (NIC 3660): Limpiar, desbridar (si es necesario), aplicar apósitos adecuados según tipo y estado de la herida.",
                    "Vigilancia de la Piel (NIC 3590): Inspeccionar la piel y la herida regularmente, valorando características (tamaño, profundidad, exudado, tejido, olor, piel perilesional).",
                    "Manejo de la Presión (NIC 3500): Utilizar superficies de apoyo adecuadas. Realizar cambios posturales.",
                    "Prevención de Úlceras por Presión (NIC 3540): Evaluar riesgo (escala Braden). Mantener piel limpia y seca. Optimizar nutrición e hidratación.",
                    "Administración de medicación tópica (NIC 2314): Aplicar tratamientos tópicos prescritos.",
                    "Manejo de la Nutrición (NIC 1100): Asegurar ingesta adecuada de proteínas, vitaminas y minerales para favorecer la cicatrización.",
                    "Control de Infecciones (NIC 6540): Utilizar técnica limpia o estéril según corresponda. Vigilar signos de infección.",
                    "Enseñanza: Cuidado de la Herida (NIC 5624): Educar al paciente/cuidador sobre el cuidado de la herida, signos de complicación y medidas preventivas."
                ]
                },
                {
                "id": "00047",
                "label": "Riesgo de deterioro de la integridad cutánea",
                "definicion": "Susceptible a la alteración de la epidermis y/o la dermis, que puede comprometer la salud.",
                "relacionadoCon": [
                    "Factores externos: Humedad (incontinencia), cizallamiento, presión, fricción, extremos de temperatura, radiación, agentes químicos, factores mecánicos (restricciones, adhesivos), inmovilización física.",
                    "Factores internos: Alteración del estado nutricional (obesidad, delgadez extrema, déficit de vitaminas/proteínas), alteración de la circulación (edema, insuficiencia vascular), alteración de la sensibilidad, alteración del estado metabólico (diabetes), alteración del turgor cutáneo, prominencias óseas, factores inmunitarios, factores del desarrollo (edades extremas), alteración de la pigmentación.",
                    "Medicación (corticoides, inmunosupresores).",
                    "Alteración de la movilidad.",
                    "Disminución del nivel de conciencia."
                ],
                "manifestadoPor": [],
                "resultadosEsperados": [
                    "El paciente mantendrá la piel intacta, sin signos de lesión (eritema, maceración, rotura). (NOC 1101 Integridad tisular: piel y membranas mucosas)",
                    "El paciente o cuidador identificará factores de riesgo personales para el deterioro cutáneo. (NOC 1902 Control del riesgo)",
                    "El paciente o cuidador describirá y aplicará medidas preventivas para mantener la integridad cutánea. (NOC 1858 Conocimiento: cuidado de la piel)"
                ],
                "intervenciones": [
                    "Vigilancia de la Piel (NIC 3590): Inspeccionar la piel regularmente, especialmente en zonas de riesgo (prominencias óseas, pliegues, zonas expuestas a humedad o presión).",
                    "Prevención de Úlceras por Presión (NIC 3540): Evaluar riesgo (escala Braden). Implementar plan preventivo individualizado.",
                    "Manejo de la Presión (NIC 3500): Realizar cambios posturales frecuentes. Utilizar superficies especiales de manejo de la presión (colchones, cojines). Evitar arrastrar al paciente.",
                    "Cuidados de la Piel: Tratamientos Tópicos (NIC 3584): Mantener la piel limpia y seca. Aplicar cremas barrera si hay riesgo por humedad. Hidratar piel seca.",
                    "Manejo de la Nutrición (NIC 1100): Asegurar una ingesta adecuada de líquidos y nutrientes (proteínas, vitaminas).",
                    "Manejo de la Incontinencia (NIC 0610 / 0590): Establecer programa de manejo de la eliminación. Cambiar pañales/ropa húmeda rápidamente. Higiene perineal.",
                    "Enseñanza: Cuidado de la Piel (NIC 5604): Educar al paciente/cuidador sobre factores de riesgo y medidas preventivas."
                ]
                },
                {
                "id": "00304",
                "label": "Riesgo de lesión por presión en el adulto",
                "definicion": "Susceptible a daño localizado en la piel y/o tejido subyacente, generalmente sobre una prominencia ósea o relacionado con un dispositivo médico u otro artefacto, como resultado de la presión o la presión en combinación con el cizallamiento, que puede comprometer la salud.",
                "relacionadoCon": [
                    "Movilidad física disminuida.",
                    "Percepción sensorial disminuida.",
                    "Humedad excesiva de la piel (incontinencia, diaforesis).",
                    "Fricción y cizallamiento.",
                    "Estado nutricional comprometido (ingesta insuficiente de proteínas/calorías/líquidos).",
                    "Perfusión tisular disminuida (hipotensión, edema, enfermedad vascular).",
                    "Nivel de conciencia disminuido.",
                    "Temperatura corporal alterada (fiebre).",
                    "Edad avanzada.",
                    "Delgadez extrema u obesidad.",
                    "Presencia de dispositivos médicos (sondas, férulas, mascarillas).",
                    "Anemia."
                ],
                "manifestadoPor": [],
                "resultadosEsperados": [
                    "El paciente mantendrá la piel intacta, sin evidencia de lesiones por presión (eritema no blanqueante, rotura). (NOC 1101 Integridad tisular: piel y membranas mucosas)",
                    "El paciente o cuidador identificará factores de riesgo individuales para desarrollar lesiones por presión. (NOC 1908 Detección del riesgo)",
                    "El paciente o cuidador implementará estrategias para prevenir las lesiones por presión. (NOC 1902 Control del riesgo)",
                    "La piel sobre prominencias óseas y bajo dispositivos médicos permanecerá intacta."
                ],
                "intervenciones": [
                    "Prevención de Úlceras por Presión (NIC 3540): Realizar valoración del riesgo (escala Braden) al ingreso y periódicamente. Implementar plan de prevención según nivel de riesgo.",
                    "Vigilancia de la Piel (NIC 3590): Inspeccionar la piel al menos una vez al día, prestando especial atención a prominencias óseas y zonas bajo dispositivos médicos.",
                    "Manejo de la Presión (NIC 3500): Realizar cambios posturales programados. Utilizar superficies especiales de manejo de la presión (colchones/cojines de alivio de presión). Proteger talones. Limitar elevación de cabecera.",
                    "Cuidados de la Piel: Tratamientos Tópicos (NIC 3584): Mantener la piel limpia y seca. Hidratar piel seca. Utilizar cremas barrera para proteger de la humedad.",
                    "Manejo de la Nutrición (NIC 1100): Asegurar ingesta adecuada de proteínas, calorías, vitaminas, minerales y líquidos.",
                    "Manejo de la Eliminación/Incontinencia (NIC 0610 / 0590): Controlar la humedad. Realizar higiene perineal frecuente.",
                    "Posicionamiento (NIC 0840): Enseñar técnicas de posicionamiento adecuadas para aliviar presión. Usar dispositivos de ayuda (almohadas, cuñas).",
                    "Cuidados del Paciente Encamado (NIC 0740): Asegurar ropa de cama limpia, seca y sin arrugas."
                ]
                },
                {
                    "id": "00312",
                    "label": "Lesión por presión en el adulto",
                    "definicion": "Daño localizado en la piel y/o tejido subyacente, generalmente sobre una prominencia ósea o relacionado con un dispositivo médico u otro artefacto, como resultado de la presión o la presión en combinación con el cizallamiento.",
                    "relacionadoCon": [
                    "Factores extrínsecos: Presión intensa/prolongada, cizallamiento, fricción, humedad excesiva, uso de dispositivos médicos.",
                    "Factores intrínsecos: Inmovilidad física, percepción sensorial disminuida, estado nutricional comprometido, perfusión tisular disminuida, estado de la piel comprometido (edema, piel frágil), edad avanzada, nivel de conciencia disminuido, enfermedades crónicas (diabetes, enfermedad vascular)."
                    ],
                    "manifestadoPor": [
                    "Lesión localizada (según estadiaje: eritema no blanqueante, pérdida parcial o total del espesor de la piel, pérdida tisular con exposición de músculo/hueso, escara, esfacelos).",
                    "Dolor en el sitio de la lesión.",
                    "Sangrado.",
                    "Signos de infección local (eritema aumentado, calor, edema, exudado purulento, mal olor).",
                    "Destrucción tisular.",
                    "Área de piel decolorada (púrpura oscuro, marrón) persistente que puede indicar lesión de tejidos profundos."
                    ],
                    "resultadosEsperados": [
                    "El paciente mostrará progresión en la curación de la lesión por presión (reducción del tamaño, mejora del lecho de la herida). (NOC 1103 Curación de la herida: por segunda intención)",
                    "La piel circundante a la lesión permanecerá intacta y sin signos de deterioro. (NOC 1101 Integridad tisular: piel y membranas mucosas)",
                    "El paciente o cuidador describirá el plan de tratamiento y los signos de complicación.",
                    "La lesión permanecerá libre de signos de infección."
                    ],
                    "intervenciones": [
                    "Cuidados de las Úlceras por Presión (NIC 3520): Valorar y documentar estadio, tamaño, profundidad, exudado, tipo de tejido, olor y estado de la piel perilesional. Limpiar la herida. Aplicar apósitos adecuados según características.",
                    "Manejo de la Presión (NIC 3500): Eliminar la presión sobre la zona afectada. Utilizar superficies de manejo de la presión. Reposicionar frecuentemente si es posible.",
                    "Vigilancia de la Piel (NIC 3590): Inspeccionar la lesión y la piel circundante en cada cambio de apósito/turno.",
                    "Manejo de la Nutrición (NIC 1100): Optimizar ingesta de proteínas, calorías, vitaminas (C, A), minerales (Zinc) y líquidos para favorecer la cicatrización.",
                    "Control del Dolor (NIC 1400): Evaluar y tratar el dolor asociado a la lesión y los cambios de apósito.",
                    "Prevención de Infecciones (NIC 6550): Utilizar técnica limpia/estéril. Vigilar signos de infección. Administrar antibióticos si se prescriben.",
                    "Desbridamiento de Heridas (NIC 3620): Realizar o asistir en el desbridamiento (quirúrgico, enzimático, autolítico, mecánico) si está indicado.",
                    "Enseñanza: Cuidado de la Herida (NIC 5624): Educar al paciente/cuidador sobre el cuidado de la lesión, prevención de nuevas lesiones y signos de alerta."
                    ]
                },
                {
                    "id": "00085",
                    "label": "Deterioro de la movilidad física",
                    "definicion": "Limitación del movimiento físico independiente e intencionado del cuerpo o de una o más extremidades.",
                    "relacionadoCon": [
                    "Disminución de la fuerza muscular, control y/o masa.",
                    "Resistencia disminuida.",
                    "Dolor o malestar.",
                    "Alteraciones musculoesqueléticas (artritis, fracturas, contracturas).",
                    "Alteraciones neuromusculares (ACV, lesión medular, esclerosis múltiple).",
                    "Rigidez articular.",
                    "Prescripción de restricción de movimientos.",
                    "Alteraciones cognitivas.",
                    "Estado de ánimo depresivo, ansiedad.",
                    "Falta de condición física, sedentarismo.",
                    "Índice de masa corporal por encima del percentil 75 apropiado para la edad.",
                    "Falta de apoyo social/ambiental."
                    ],
                    "manifestadoPor": [
                    "Disminución del rango de movimiento.",
                    "Dificultad para girarse en la cama.",
                    "Inestabilidad postural.",
                    "Limitación de la habilidad para las habilidades motoras finas o gruesas.",
                    "Movimientos lentos, descoordinados o espasmódicos.",
                    "Necesidad de ayuda de persona(s) o dispositivo(s) para la deambulación/movilización.",
                    "Disnea de esfuerzo.",
                    "Temblor inducido por el movimiento."
                    ],
                    "resultadosEsperados": [
                    "El paciente demostrará el uso seguro de dispositivos de ayuda para la movilidad. (NOC 0200 Ambulación / NOC 0221 Ambulación: silla de ruedas)",
                    "El paciente mantendrá o mejorará la fuerza y función muscular de las extremidades afectadas/no afectadas. (NOC 0208 Movilidad)",
                    "El paciente realizará traslados de forma segura (cama-silla, silla-wc). (NOC 0210 Realización del traslado)",
                    "El paciente verbalizará sentirse más seguro al moverse.",
                    "El paciente participará en las actividades de la vida diaria según su capacidad."
                    ],
                    "intervenciones": [
                    "Terapia de Ejercicios: Movilidad Articular (NIC 0224): Realizar ejercicios pasivos o activo-asistidos para mantener rango de movimiento.",
                    "Terapia de Ejercicios: Control Muscular (NIC 0226): Implementar programa de ejercicios de fortalecimiento.",
                    "Terapia de Ejercicios: Ambulación (NIC 0221): Ayudar al paciente a deambular progresivamente. Enseñar uso de bastón, andador o muletas.",
                    "Ayuda con los Autocuidados: Transferencia (NIC 1806): Enseñar y ayudar en las transferencias seguras.",
                    "Fomento del Ejercicio (NIC 0200): Animar a la participación en actividades físicas adaptadas.",
                    "Manejo del Dolor (NIC 1400): Administrar analgesia antes de la movilización si hay dolor.",
                    "Prevención de Caídas (NIC 6490): Identificar y modificar riesgos ambientales. Educar sobre seguridad.",
                    "Posicionamiento (NIC 0840): Alinear el cuerpo correctamente. Cambiar de posición frecuentemente para prevenir complicaciones."
                    ]
                },
                {
                    "id": "00155",
                    "label": "Riesgo de caídas",
                    "definicion": "Susceptible a un aumento de la propensión a las caídas, que puede causar daño físico y comprometer la salud.",
                    "relacionadoCon": [
                    "Factores fisiológicos: Edad ≥65 años, antecedentes de caídas, deterioro de la movilidad física, disminución de la fuerza en extremidades inferiores, dificultades en la marcha/equilibrio, deterioro visual/auditivo, enfermedad aguda/crónica (neurológica, cardiovascular, musculoesquelética), hipotensión ortostática, incontinencia urinaria/urgencia miccional, deterioro cognitivo (confusión, demencia), insomnio, dolor.",
                    "Factores ambientales: Entorno desconocido/desordenado, iluminación inadecuada, superficies resbaladizas/irregulares, calzado inadecuado, uso de dispositivos de ayuda defectuosos/mal ajustados, restricciones físicas.",
                    "Factores farmacológicos: Uso de ≥4 medicamentos, fármacos psicotrópicos (sedantes, hipnóticos, antidepresivos), antihipertensivos, diuréticos, laxantes.",
                    "Factores relacionados con los cuidados: Falta de supervisión adecuada, transferencia/movilización insegura."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente permanecerá libre de caídas durante [especificar tiempo]. (NOC 1909 Conducta de prevención de caídas)",
                    "El paciente o cuidador identificará factores de riesgo personales y ambientales para las caídas. (NOC 1828 Conocimiento: prevención de caídas)",
                    "El paciente o cuidador modificará el entorno para aumentar la seguridad. (NOC 1910 Ambiente seguro en el hogar)",
                    "El paciente utilizará correctamente los dispositivos de ayuda y solicitará asistencia cuando sea necesario."
                    ],
                    "intervenciones": [
                    "Prevención de Caídas (NIC 6490): Identificar pacientes de riesgo (usar escala de riesgo). Implementar protocolo de prevención (pulsera identificativa, señalización).",
                    "Identificación de Riesgos (NIC 6610): Evaluar factores de riesgo individuales y ambientales.",
                    "Manejo Ambiental: Seguridad (NIC 6486): Asegurar buena iluminación (luz nocturna). Mantener entorno ordenado y libre de obstáculos. Asegurar suelos secos. Utilizar barras de apoyo/asideros. Cama en posición baja.",
                    "Ayuda con los Autocuidados (NIC 1800): Asistir en la movilización y el aseo según necesidad. Asegurar que el timbre de llamada esté al alcance.",
                    "Vigilancia: Seguridad (NIC 6654): Supervisar a pacientes con alto riesgo, especialmente durante la noche o en el baño.",
                    "Enseñanza: Seguridad (NIC 5603): Educar al paciente/familia sobre factores de riesgo y estrategias de prevención (levantarse lentamente, usar calzado adecuado, revisar visión).",
                    "Manejo de la Medicación (NIC 2380): Revisar medicación y sus efectos secundarios relacionados con el riesgo de caídas. Colaborar con médico/farmacéutico para optimizar tratamiento.",
                    "Terapia de Ejercicios: Equilibrio (NIC 0222): Implementar ejercicios para mejorar el equilibrio y la fuerza si es apropiado."
                    ]
                },
                {
                    "id": "00040",
                    "label": "Riesgo de síndrome de desuso",
                    "definicion": "Susceptible al deterioro de los sistemas corporales como resultado de la inactividad musculoesquelética prescrita o inevitable, que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Inmovilización prescrita (tracción, yeso, reposo absoluto).",
                    "Alteración del nivel de conciencia.",
                    "Dolor intenso.",
                    "Parálisis.",
                    "Inmovilidad mecánica (ventilación mecánica, múltiples vías/drenajes)."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente mantendrá la función de los sistemas corporales (musculoesquelético, cardiovascular, respiratorio, tegumentario, gastrointestinal, genitourinario) dentro de los límites normales o basales. (NOC 0204 Consecuencias de la inmovilidad: fisiológicas)",
                    "El paciente permanecerá libre de complicaciones de la inmovilidad (trombosis venosa profunda, úlceras por presión, neumonía, estreñimiento, contracturas).",
                    "El paciente o cuidador participará en las intervenciones para prevenir el síndrome de desuso."
                    ],
                    "intervenciones": [
                    "Prevención del Síndrome de Desuso (General): Fomentar la máxima movilidad posible dentro de las limitaciones.",
                    "Terapia de Ejercicios: Movilidad Articular (NIC 0224): Realizar ejercicios de rango de movimiento pasivos o activos en todas las articulaciones posibles, varias veces al día.",
                    "Terapia de Ejercicios: Control Muscular (NIC 0226): Realizar ejercicios isométricos si el movimiento activo está contraindicado.",
                    "Cuidados del Paciente Encamado (NIC 0740): Cambiar de posición frecuentemente (cada 2 horas). Mantener alineación corporal.",
                    "Prevención de Úlceras por Presión (NIC 3540): Inspeccionar piel. Utilizar superficies de alivio de presión.",
                    "Precauciones para Evitar la Aspiración (NIC 3200): Elevar cabecera si es posible. Valorar reflejo tusígeno/nauseoso.",
                    "Manejo de las Vías Aéreas (NIC 3140): Fomentar tos y respiraciones profundas. Considerar espirometría incentiva.",
                    "Monitorización de Signos Vitales (NIC 6680): Vigilar signos de complicaciones (TVP, embolia pulmonar).",
                    "Manejo de la Eliminación Intestinal/Urinaria (NIC 0430/0590): Asegurar hidratación y fibra. Vigilar patrón de eliminación.",
                    "Fomento de la Implicación Familiar (NIC 7110): Educar e involucrar a la familia en los ejercicios y cuidados preventivos."
                    ]
                },
                {
                    "id": "00031",
                    "label": "Limpieza ineficaz de las vías aéreas",
                    "definicion": "Incapacidad para eliminar las secreciones u obstrucciones del tracto respiratorio para mantener las vías aéreas permeables.",
                    "relacionadoCon": [
                    "Factores ambientales: Tabaquismo, humo, alérgenos.",
                    "Obstrucción de las vías aéreas: Secreciones retenidas, mucosidad excesiva, espasmo de las vías aéreas, presencia de vía aérea artificial, cuerpo extraño.",
                    "Factores fisiológicos: Disfunción neuromuscular (sedación, lesión medular), alteración del nivel de conciencia, infección respiratoria (neumonía, bronquitis), enfermedad pulmonar obstructiva crónica (EPOC), asma, hidratación inadecuada, inmovilidad.",
                    "Tos ineficaz (por dolor, fatiga, debilidad muscular)."
                    ],
                    "manifestadoPor": [
                    "Sonidos respiratorios adventicios (roncus, sibilancias, crepitantes).",
                    "Disminución de los sonidos respiratorios.",
                    "Cambios en la frecuencia o patrón respiratorio.",
                    "Disnea, dificultad para respirar.",
                    "Tos ausente o ineficaz.",
                    "Producción de esputo (cantidad, color, consistencia).",
                    "Ortopnea.",
                    "Agitación, ansiedad.",
                    "Cianosis.",
                    "Ojos muy abiertos."
                    ],
                    "resultadosEsperados": [
                    "El paciente mantendrá una vía aérea permeable. (NOC 0410 Estado respiratorio: permeabilidad de las vías respiratorias)",
                    "El paciente demostrará una tos efectiva. (NOC 0410)",
                    "El paciente mostrará sonidos respiratorios limpios o mejorados. (NOC 0415 Estado respiratorio)",
                    "El paciente movilizará y expectorará las secreciones eficazmente.",
                    "El paciente mantendrá una saturación de oxígeno dentro de límites aceptables."
                    ],
                    "intervenciones": [
                    "Manejo de las Vías Aéreas (NIC 3140): Auscultar sonidos respiratorios. Fomentar tos efectiva o asistir la tos. Colocar en posición Fowler/semi-Fowler.",
                    "Aspiración de las Vías Aéreas (NIC 3160): Realizar aspiración nasofaríngea/orofaríngea o endotraqueal si es necesario, según protocolo.",
                    "Fisioterapia Respiratoria (NIC 3230): Realizar percusión/vibración torácica, drenaje postural, según indicación.",
                    "Administración de Medicación: Inhalatoria (NIC 2304): Administrar broncodilatadores/mucolíticos según prescripción.",
                    "Oxigenoterapia (NIC 3320): Administrar oxígeno suplementario según necesidad/prescripción.",
                    "Monitorización Respiratoria (NIC 3350): Vigilar frecuencia, ritmo, profundidad respiratoria, uso de músculos accesorios, saturación de oxígeno.",
                    "Fomento de la Tos (NIC 3250): Enseñar técnicas de tos controlada/asistida. Apoyar incisiones torácicas/abdominales durante la tos.",
                    "Hidratación (NIC 4120): Asegurar ingesta adecuada de líquidos para fluidificar secreciones (si no está contraindicado)."
                    ]
                },
                {
                    "id": "00032",
                    "label": "Patrón respiratorio ineficaz",
                    "definicion": "Inspiración y/o espiración que no proporciona una ventilación adecuada.",
                    "relacionadoCon": [
                    "Hiperventilación.",
                    "Hipoventilación.",
                    "Deformidad ósea (pared torácica).",
                    "Dolor.",
                    "Ansiedad.",
                    "Deterioro musculoesquelético.",
                    "Fatiga de los músculos respiratorios.",
                    "Obesidad.",
                    "Posición corporal que impide la expansión pulmonar.",
                    "Síndrome de hipoventilación.",
                    "Lesión de la médula espinal.",
                    "Deterioro neurológico/inmadurez neurológica.",
                    "Disfunción neuromuscular."
                    ],
                    "manifestadoPor": [
                    "Patrón respiratorio anormal (frecuencia, ritmo, profundidad).",
                    "Bradipnea o Taquipnea.",
                    "Disnea.",
                    "Uso de los músculos accesorios para respirar.",
                    "Respiración con los labios fruncidos.",
                    "Aleteo nasal.",
                    "Ortopnea.",
                    "Alteración de la profundidad respiratoria.",
                    "Fase espiratoria prolongada.",
                    "Disminución de la presión inspiratoria/espiratoria.",
                    "Disminución de la capacidad vital.",
                    "Aumento del diámetro anteroposterior del tórax.",
                    "Asume posición de trípode."
                    ],
                    "resultadosEsperados": [
                    "El paciente mostrará un patrón respiratorio eficaz (frecuencia, ritmo, profundidad dentro de límites normales). (NOC 0415 Estado respiratorio)",
                    "El paciente no presentará disnea o referirá una disminución de la misma. (NOC 0415)",
                    "El paciente mantendrá una saturación de oxígeno adecuada. (NOC 0402 Estado respiratorio: intercambio gaseoso)",
                    "El paciente verbalizará sensación de comodidad respiratoria."
                    ],
                    "intervenciones": [
                    "Monitorización Respiratoria (NIC 3350): Vigilar frecuencia, ritmo, profundidad y esfuerzo respiratorio. Observar uso de músculos accesorios, aleteo nasal, retracciones.",
                    "Manejo de las Vías Aéreas (NIC 3140): Colocar al paciente en posición que facilite la ventilación (semi-Fowler). Auscultar sonidos respiratorios.",
                    "Oxigenoterapia (NIC 3320): Administrar oxígeno según prescripción/necesidad.",
                    "Ayuda a la Ventilación (NIC 3390): Asistir con la ventilación si es necesario (CPAP, BiPAP, ventilación mecánica). Enseñar técnicas de respiración (labios fruncidos, diafragmática).",
                    "Manejo del Dolor (NIC 1400): Controlar el dolor que pueda afectar la respiración.",
                    "Manejo de la Ansiedad (NIC 5820): Reducir la ansiedad que pueda contribuir a la hiperventilación o disnea.",
                    "Monitorización de Signos Vitales (NIC 6680): Controlar frecuencia cardíaca, presión arterial, temperatura.",
                    "Aspiración de las Vías Aéreas (NIC 3160): Mantener vías aéreas permeables si hay secreciones asociadas."
                    ]
                },
                {
                    "id": "00030",
                    "label": "Deterioro del intercambio gaseoso",
                    "definicion": "Exceso o déficit en la oxigenación y/o eliminación de dióxido de carbono en la membrana alveolocapilar.",
                    "relacionadoCon": [
                    "Desequilibrio ventilación-perfusión.",
                    "Cambios en la membrana alveolocapilar (edema pulmonar, atelectasia, neumonía, síndrome de dificultad respiratoria).",
                    "Disminución del oxígeno inspirado.",
                    "Hipoventilación.",
                    "Alteraciones del transporte de oxígeno (anemia, intoxicación por CO)."
                    ],
                    "manifestadoPor": [
                    "Gasometría arterial anormal (hipoxemia: PaO2 baja; hipercapnia: PaCO2 alta; pH bajo).",
                    "Saturación de oxígeno anormal (SpO2 baja).",
                    "Respiración anormal (frecuencia, ritmo, profundidad).",
                    "Hipoxia.",
                    "Cianosis (signo tardío).",
                    "Confusión, somnolencia, agitación, irritabilidad.",
                    "Taquicardia.",
                    "Diaforesis.",
                    "Cefalea al despertar.",
                    "Color anormal de la piel (pálido, cianótico).",
                    "Alteraciones visuales."
                    ],
                    "resultadosEsperados": [
                    "El paciente mantendrá una gasometría arterial y/o saturación de oxígeno dentro de los límites aceptables/normales. (NOC 0402 Estado respiratorio: intercambio gaseoso)",
                    "El paciente mostrará un estado mental orientado y sin signos de hipoxia cerebral (confusión, agitación). (NOC 0909 Estado neurológico)",
                    "El paciente referirá ausencia o disminución de la disnea. (NOC 0415 Estado respiratorio)",
                    "El paciente mantendrá un color de piel y mucosas normal."
                    ],
                    "intervenciones": [
                    "Monitorización Respiratoria (NIC 3350): Vigilar patrón respiratorio, SpO2, signos de dificultad respiratoria.",
                    "Monitorización de Signos Vitales (NIC 6680): Controlar FC, FR, TA.",
                    "Manejo Ácido-Base (NIC 191x): Interpretar resultados de gasometría arterial. Monitorizar equilibrio ácido-base.",
                    "Oxigenoterapia (NIC 3320): Administrar oxígeno a la concentración prescrita para mantener SpO2 adecuada.",
                    "Manejo de las Vías Aéreas (NIC 3140): Asegurar permeabilidad. Posicionar para optimizar ventilación.",
                    "Ayuda a la Ventilación (NIC 3390): Utilizar ventilación no invasiva o invasiva según indicación.",
                    "Monitorización Neurológica (NIC 2620): Evaluar estado mental, nivel de conciencia, signos de hipoxia.",
                    "Regulación Hemodinámica (NIC 4150): Manejar fluidos y medicación vasoactiva si es necesario para optimizar perfusión."
                    ]
                },
                {
                    "id": "00039",
                    "label": "Riesgo de aspiración",
                    "definicion": "Susceptible de que penetren en el árbol traqueobronquial secreciones gastrointestinales, orofaríngeas, sólidos o líquidos, que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Disminución del nivel de conciencia.",
                    "Reflejos de tos o nauseoso deprimidos.",
                    "Presencia de tubo de traqueostomía o endotraqueal.",
                    "Sonda gastrointestinal (nasogástrica, gastrostomía).",
                    "Alimentación por sonda.",
                    "Deterioro de la deglución.",
                    "Cirugía o traumatismo facial, oral o del cuello.",
                    "Situaciones que dificultan la elevación de la parte superior del cuerpo.",
                    "Aumento de la presión intragástrica (obesidad, ascitis).",
                    "Vaciamiento gástrico retrasado.",
                    "Reflujo gastroesofágico.",
                    "Bolo de alimentación grande."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente mantendrá la vía aérea permeable y libre de aspiración. (NOC 1918 Prevención de la aspiración)",
                    "El paciente demostrará una deglución segura si se alimenta por vía oral. (NOC 1010 Estado de deglución)",
                    "El paciente no presentará signos ni síntomas de aspiración (tos, disnea, cianosis, sonidos respiratorios anormales post-ingesta/alimentación).",
                    "Los cuidadores/paciente identificarán factores de riesgo y aplicarán medidas preventivas."
                    ],
                    "intervenciones": [
                    "Precauciones para Evitar la Aspiración (NIC 3200): Mantener cabecera elevada (30-45º) durante y después de la alimentación/comida. Comprobar colocación de sonda y residuo gástrico antes de alimentar. Evitar sedación excesiva.",
                    "Vigilancia (NIC 6650): Observar estado respiratorio, nivel de conciencia, reflejos tusígeno/nauseoso.",
                    "Manejo de la Alimentación Enteral (NIC 1056): Administrar fórmula a ritmo adecuado. Usar volúmenes pequeños si hay riesgo.",
                    "Manejo de la Deglución (NIC 1860): Si hay alimentación oral, posicionar correctamente, ofrecer texturas adecuadas, supervisar ingesta, comprobar boca vacía.",
                    "Aspiración de las Vías Aéreas (NIC 3160): Tener equipo de aspiración disponible. Aspirar si es necesario.",
                    "Cuidados del Tubo de Traqueostomía/Endotraqueal (NIC 3180): Mantener presión del balón adecuada. Aspirar secreciones orofaríngeas por encima del balón.",
                    "Enseñanza: Procedimiento/Tratamiento (NIC 5618): Educar al paciente/familia sobre medidas preventivas.",
                    "Monitorización Respiratoria (NIC 3350): Auscultar campos pulmonares."
                    ]
                },
                {
                    "id": "00103",
                    "label": "Deterioro de la deglución",
                    "definicion": "Funcionamiento anormal del mecanismo de la deglución asociado con un déficit de la estructura o función oral, faríngea o esofágica.",
                    "relacionadoCon": [
                    "Anomalías congénitas o adquiridas de la vía aérea superior, boca, faringe o esófago (traumatismos, cirugía, tumores).",
                    "Problemas neurológicos/neuromusculares (ACV, lesión cerebral, Parkinson, esclerosis múltiple, parálisis cerebral, distrofia muscular).",
                    "Traqueostomía o tubo endotraqueal.",
                    "Anomalías de la fase oral (debilidad lingual, falta de dientes, mala oclusión, disminución de salivación).",
                    "Anomalías de la fase faríngea (retraso/ausencia del reflejo deglutorio, disfunción cricofaríngea, reducción del peristaltismo faríngeo).",
                    "Anomalías de la fase esofágica (obstrucción, espasmo, reflujo gastroesofágico)."
                    ],
                    "manifestadoPor": [
                    "Observación de dificultad en la deglución (tos, atragantamiento, carraspeo antes/durante/después de tragar).",
                    "Regurgitación nasal.",
                    "Rechazo de alimentos.",
                    "Babeo o dificultad para controlar secreciones orales.",
                    "Voz húmeda o gargajosa después de tragar.",
                    "Degluciones múltiples para un solo bocado.",
                    "Residuos de comida en la boca después de tragar.",
                    "Infecciones respiratorias recurrentes.",
                    "Pérdida de peso inexplicada.",
                    "Tiempo de comida prolongado.",
                    "Sensación de comida atascada.",
                    "Dolor al tragar (odinofagia)."
                    ],
                    "resultadosEsperados": [
                    "El paciente demostrará una deglución segura y eficaz con la consistencia de alimentos/líquidos recomendada. (NOC 1010 Estado de deglución)",
                    "El paciente mantendrá una vía aérea permeable durante y después de la alimentación. (NOC 1918 Prevención de la aspiración)",
                    "El paciente mantendrá un estado nutricional e hidratación adecuados. (NOC 1004 Estado nutricional / NOC 1009 Estado nutricional: ingestión de nutrientes)",
                    "El paciente o cuidador verbalizará y aplicará estrategias para facilitar la deglución segura."
                    ],
                    "intervenciones": [
                    "Terapia de Deglución (NIC 1860): Realizar valoración de la deglución (puede requerir evaluación por logopeda/foniatra). Determinar consistencia más segura para alimentos/líquidos. Enseñar maniobras deglutorias compensatorias (ej. deglución supraglótica, esfuerzo deglutorio).",
                    "Precauciones para Evitar la Aspiración (NIC 3200): Posicionar correctamente (sentado, erguido). Supervisar comidas. Evitar distracciones. Higiene oral antes y después.",
                    "Manejo de la Alimentación (NIC 1100 / 1050): Ofrecer bocados pequeños. Dar tiempo suficiente. Comprobar boca vacía.",
                    "Modificación de la Dieta (NIC 1120): Espesar líquidos. Ofrecer alimentos de textura homogénea y fácil manejo (purés, etc.) según indicación.",
                    "Vigilancia (NIC 6650): Observar signos de dificultad deglutoria o aspiración durante las comidas.",
                    "Aspiración de las Vías Aéreas (NIC 3160): Tener equipo disponible. Aspirar si hay sospecha de aspiración.",
                    "Monitorización Nutricional (NIC 1160): Controlar peso, ingesta y signos de desnutrición/deshidratación.",
                    "Colaboración Interdisciplinar: Consultar con logopeda, dietista, médico."
                    ]
                },
                {
                    "id": "00011",
                    "label": "Estreñimiento",
                    "definicion": "Disminución de la frecuencia normal de defecación, acompañada de eliminación dificultosa o incompleta de heces y/o eliminación de heces excesivamente duras y secas.",
                    "relacionadoCon": [
                    "Funcionales: Hábitos de defecación irregulares, ignorar el reflejo de defecación, actividad física insuficiente, hidratación insuficiente, ingesta insuficiente de fibra, debilidad de los músculos abdominales.",
                    "Psicológicos: Estrés emocional, confusión, depresión.",
                    "Farmacológicos: Uso de opiáceos, antiácidos (con aluminio/calcio), anticolinérgicos, antidepresivos, hierro, laxantes (abuso).",
                    "Mecánicos: Obstrucción (tumores, estenosis), megacolon, rectocele, prolapso rectal, hemorroides/fisuras anales dolorosas.",
                    "Fisiológicos: Cambios en los patrones alimentarios o de actividad, embarazo, envejecimiento, hipotiroidismo, trastornos neurológicos (lesión medular, Parkinson), desequilibrios electrolíticos (hipercalcemia, hipopotasemia), deshidratación."
                    ],
                    "manifestadoPor": [
                    "Disminución de la frecuencia de las deposiciones (comparado con el patrón habitual del paciente).",
                    "Heces duras, formadas, secas.",
                    "Esfuerzo excesivo al defecar.",
                    "Sensación de evacuación incompleta o de obstrucción/bloqueo rectal.",
                    "Dolor abdominal, cólicos, distensión abdominal.",
                    "Incapacidad para eliminar heces.",
                    "Presencia de masa abdominal o rectal palpable.",
                    "Disminución del volumen de las heces.",
                    "Sonidos intestinales hipoactivos.",
                    "Puede haber eliminación de heces líquidas (falsa diarrea por rebosamiento)."
                    ],
                    "resultadosEsperados": [
                    "El paciente establecerá/recuperará un patrón de eliminación intestinal regular y sin esfuerzo. (NOC 0501 Eliminación intestinal)",
                    "El paciente describirá medidas dietéticas y de estilo de vida para prevenir el estreñimiento. (NOC 1805 Conocimiento: régimen terapéutico)",
                    "El paciente referirá ausencia de dolor o molestia abdominal asociada.",
                    "El paciente eliminará heces blandas y formadas."
                    ],
                    "intervenciones": [
                    "Manejo del Estreñimiento/Impactación (NIC 0450): Evaluar patrón intestinal habitual y actual. Identificar factores causales. Fomentar ingesta de líquidos y fibra. Promover actividad física.",
                    "Manejo Intestinal (NIC 0430): Establecer horario regular para intentar defecar (aprovechar reflejo gastrocólico). Asegurar privacidad.",
                    "Administración de Medicación: Laxantes/Enemas (NIC 2300 / 2313 / 0460): Administrar laxantes, supositorios o enemas según prescripción. Educar sobre uso adecuado y evitar abuso.",
                    "Monitorización de la Eliminación Intestinal: Vigilar frecuencia, consistencia, color, volumen de las heces. Auscultar sonidos intestinales.",
                    "Manejo de Líquidos/Nutrición (NIC 4120 / 1100): Aumentar ingesta de líquidos (agua, zumos) y fibra (frutas, verduras, cereales integrales) según tolerancia y condición médica.",
                    "Enseñanza: Dieta Prescrita (NIC 5614): Educar sobre la importancia de la fibra y los líquidos.",
                    "Extracción Manual de Fecalomas (NIC 0480): Realizar si está indicado y prescrito.",
                    "Manejo del Dolor (NIC 1400): Tratar el dolor abdominal si está presente."
                    ]
                },
                {
                    "id": "00015",
                    "label": "Riesgo de estreñimiento",
                    "definicion": "Susceptible a una disminución en la frecuencia normal de defecación acompañada de eliminación dificultosa o incompleta de las heces y/o eliminación de heces excesivamente duras y secas, que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Funcionales: Actividad física insuficiente, hidratación insuficiente, ingesta insuficiente de fibra, hábitos de defecación irregulares, cambio reciente en el entorno, debilidad de los músculos abdominales.",
                    "Psicológicos: Estrés emocional, confusión, depresión.",
                    "Farmacológicos: Uso crónico de opiáceos, antiácidos (con aluminio/calcio), anticolinérgicos, antidepresivos, hierro, laxantes.",
                    "Mecánicos: Embarazo, obesidad, tumores, megacolon.",
                    "Fisiológicos: Envejecimiento, hipotiroidismo, trastornos neurológicos, deshidratación, disminución de la motilidad gastrointestinal, inmovilidad."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente mantendrá su patrón de eliminación intestinal habitual. (NOC 0501 Eliminación intestinal)",
                    "El paciente identificará factores de riesgo individuales para el estreñimiento. (NOC 1805 Conocimiento: régimen terapéutico)",
                    "El paciente describirá y aplicará medidas preventivas (dieta, líquidos, ejercicio). (NOC 1602 Conducta de fomento de la salud)",
                    "El paciente no desarrollará estreñimiento."
                    ],
                    "intervenciones": [
                    "Manejo Intestinal (NIC 0430): Evaluar patrón intestinal habitual. Fomentar hábitos regulares.",
                    "Manejo de Líquidos/Nutrición (NIC 4120 / 1100): Asegurar ingesta adecuada de líquidos (mínimo 1.5-2 L/día si no contraindicado) y fibra dietética.",
                    "Fomento del Ejercicio (NIC 0200): Animar a la actividad física regular según capacidad.",
                    "Enseñanza: Dieta Prescrita/Proceso Enfermedad (NIC 5614 / 5602): Educar sobre factores de riesgo, importancia de fibra, líquidos y ejercicio.",
                    "Vigilancia (NIC 6650): Monitorizar frecuencia y características de las deposiciones.",
                    "Manejo de la Medicación (NIC 2380): Revisar medicación que pueda causar estreñimiento. Considerar profilaxis si se inician opiáceos.",
                    "Manejo Ambiental: Confort (NIC 6482): Asegurar privacidad y acceso fácil al baño."
                    ]
                },
                {
                    "id": "00013",
                    "label": "Diarrea",
                    "definicion": "Eliminación de tres o más deposiciones líquidas o no formadas al día.",
                    "relacionadoCon": [
                    "Psicológicos: Estrés elevado, ansiedad.",
                    "Situacionales: Abuso de laxantes, abuso de alcohol, toxinas (contaminación alimentaria), efectos adversos de medicamentos (antibióticos, antiácidos con magnesio), radiación, viajes.",
                    "Fisiológicos: Procesos infecciosos (víricos, bacterianos, parasitarios), inflamación gastrointestinal (colitis ulcerosa, Crohn), malabsorción (intolerancia a lactosa, celiaquía), síndrome del intestino irritable, alimentación por sonda."
                    ],
                    "manifestadoPor": [
                    "Eliminación de ≥3 deposiciones líquidas/día.",
                    "Dolor abdominal tipo cólico.",
                    "Urgencia para defecar.",
                    "Sonidos intestinales hiperactivos.",
                    "Puede haber moco o sangre en heces (según causa).",
                    "Irritación perianal."
                    ],
                    "resultadosEsperados": [
                    "El paciente recuperará su patrón de eliminación intestinal habitual con heces formadas. (NOC 0501 Eliminación intestinal)",
                    "El paciente mantendrá el equilibrio hídrico y electrolítico. (NOC 0601 Equilibrio hídrico / NOC 0600 Equilibrio electrolítico)",
                    "El paciente referirá ausencia de dolor abdominal y urgencia.",
                    "El paciente mantendrá la integridad de la piel perianal. (NOC 1101 Integridad tisular: piel y membranas mucosas)"
                    ],
                    "intervenciones": [
                    "Manejo de la Diarrea (NIC 0460): Evaluar causa, frecuencia, características de las heces. Pesar diariamente. Monitorizar signos de deshidratación y desequilibrio electrolítico.",
                    "Manejo de Líquidos/Electrolitos (NIC 2080): Fomentar ingesta oral de líquidos (agua, soluciones de rehidratación oral). Administrar líquidos IV si es necesario/prescrito.",
                    "Manejo de la Nutrición (NIC 1100): Recomendar dieta astringente (BRAT: plátano, arroz, manzana, tostada) o baja en residuos temporalmente. Evitar irritantes (cafeína, alcohol, picantes, grasas). Reintroducir dieta habitual gradualmente.",
                    "Administración de Medicación (NIC 2300): Administrar antidiarreicos/antibióticos según prescripción y causa.",
                    "Cuidados de la Piel: Zona Perianal (NIC 3584): Limpiar suavemente después de cada deposición. Aplicar crema barrera.",
                    "Control de Infecciones (NIC 6540): Implementar precauciones de contacto si la causa es infecciosa.",
                    "Enseñanza: Proceso de Enfermedad (NIC 5602): Educar sobre higiene, manejo dietético y signos de complicación."
                    ]
                },
                {
                    "id": "00014",
                    "label": "Incontinencia fecal",
                    "definicion": "Cambio en el hábito de eliminación fecal normal, caracterizado por la eliminación involuntaria de heces.",
                    "relacionadoCon": [
                    "Disminución del tono muscular del esfínter rectal.",
                    "Impactación fecal con rebosamiento.",
                    "Deterioro cognitivo.",
                    "Lesión del esfínter anal (trauma obstétrico, cirugía).",
                    "Disfunción neurológica (lesión medular, ACV, demencia).",
                    "Diarrea crónica.",
                    "Incapacidad para reconocer/responder a la urgencia de defecar.",
                    "Barreras ambientales para acceder al baño.",
                    "Movilidad física deteriorada."
                    ],
                    "manifestadoPor": [
                    "Eliminación involuntaria constante de heces blandas.",
                    "Olor fecal.",
                    "Incapacidad para retrasar la defecación.",
                    "Manchado fecal en la ropa interior.",
                    "Urgencia fecal.",
                    "Incapacidad para sentir el recto lleno o la necesidad de defecar.",
                    "Piel perianal eritematosa o macerada."
                    ],
                    "resultadosEsperados": [
                    "El paciente mantendrá la continencia fecal o reducirá la frecuencia de episodios de incontinencia. (NOC 0500 Continencia intestinal)",
                    "El paciente participará en un programa de reeducación intestinal si es apropiado.",
                    "El paciente mantendrá la integridad de la piel perianal. (NOC 1101 Integridad tisular: piel y membranas mucosas)",
                    "El paciente o cuidador describirá el plan de manejo de la incontinencia."
                    ],
                    "intervenciones": [
                    "Manejo Intestinal: Incontinencia Fecal (NIC 0440): Evaluar patrón y causa. Establecer programa de reeducación intestinal (horario regular para ir al baño, uso de supositorios si indicado).",
                    "Entrenamiento del Hábito Intestinal (NIC 0470): Ayudar al paciente a ir al baño a intervalos regulares.",
                    "Manejo del Estreñimiento/Impactación (NIC 0450): Prevenir/tratar impactación fecal que puede causar incontinencia por rebosamiento.",
                    "Cuidados Perineales (NIC 1750): Mantener piel limpia y seca. Usar productos barrera.",
                    "Manejo Ambiental (NIC 6480): Asegurar acceso fácil y rápido al baño. Proporcionar dispositivos de ayuda (silla-inodoro portátil).",
                    "Manejo de la Diarrea (NIC 0460): Tratar la diarrea si es la causa de la incontinencia.",
                    "Terapia de Ejercicios: Control Muscular (NIC 0226): Enseñar ejercicios del suelo pélvico (Kegel) si hay debilidad muscular.",
                    "Uso de Dispositivos de Contención: Considerar el uso de pañales absorbentes o colectores fecales externos si es necesario, priorizando la dignidad del paciente."
                    ]
                },
                {
                    "id": "00016",
                    "label": "Deterioro de la eliminación urinaria",
                    "definicion": "Disfunción en la eliminación de orina. (Nota: Diagnóstico retirado por NANDA-I, usar diagnósticos más específicos como Retención Urinaria, Incontinencia Urinaria [funcional, de estrés, de urgencia, refleja], etc.)",
                    "relacionadoCon": [
                    "Obstrucción anatómica (hiperplasia prostática, estenosis uretral).",
                    "Disfunción sensoriomotora (lesión medular, vejiga neurogénica).",
                    "Infección del tracto urinario.",
                    "Debilidad de las estructuras pélvicas.",
                    "Factores psicológicos (ansiedad).",
                    "Efectos de medicación (anticolinérgicos, diuréticos)."
                    ],
                    "manifestadoPor": [
                    "Disuria (dolor/escozor al orinar).",
                    "Polaquiuria (aumento de la frecuencia miccional).",
                    "Urgencia miccional.",
                    "Nicturia (necesidad de orinar por la noche).",
                    "Dificultad para iniciar el chorro miccional (hesitación).",
                    "Chorro urinario débil o interrumpido.",
                    "Goteo postmiccional.",
                    "Incontinencia (pérdida involuntaria de orina).",
                    "Retención urinaria (incapacidad para vaciar la vejiga completamente, globo vesical palpable).",
                    "Enuresis (micción involuntaria, especialmente nocturna)."
                    ],
                    "resultadosEsperados": [
                    "El paciente recuperará un patrón de eliminación urinaria eficaz. (NOC 0503 Eliminación urinaria)",
                    "El paciente mantendrá la continencia urinaria o gestionará la incontinencia eficazmente. (NOC 0502 Continencia urinaria)",
                    "El paciente vaciará la vejiga completamente (sin residuo postmiccional significativo).",
                    "El paciente referirá ausencia de disuria, urgencia excesiva o dificultad miccional."
                    ],
                    "intervenciones": [
                    "Manejo de la Eliminación Urinaria (NIC 0590): Monitorizar patrón de eliminación (frecuencia, volumen, características de la orina). Evaluar ingesta de líquidos.",
                    "Cuidados de la Retención Urinaria (NIC 0620): Estimular micción (privacidad, agua corriente, calor local). Realizar sondaje vesical intermitente o permanente según prescripción. Medir residuo postmiccional.",
                    "Manejo de la Incontinencia Urinaria (NIC 0610): Identificar tipo de incontinencia. Implementar plan de manejo (ejercicios suelo pélvico, reeducación vesical, manejo de líquidos, dispositivos).",
                    "Sondaje Vesical (NIC 0580): Realizar sondaje con técnica aséptica.",
                    "Entrenamiento de la Vejiga (NIC 0600): Establecer horarios fijos para intentar orinar.",
                    "Enseñanza: Proceso de Enfermedad (NIC 5602): Educar sobre la causa del problema y el plan de tratamiento.",
                    "Prevención de Infecciones del Tracto Urinario (NIC 6540): Fomentar higiene perineal, ingesta de líquidos, vaciado completo de vejiga."
                    ]
                },
                {
                    "id": "00017",
                    "label": "Incontinencia urinaria de estrés",
                    "definicion": "Pérdida súbita de orina al realizar actividades que aumentan la presión intraabdominal.",
                    "relacionadoCon": [
                    "Debilidad de los músculos del suelo pélvico.",
                    "Hipermotilidad uretral.",
                    "Insuficiencia intrínseca del esfínter uretral.",
                    "Factores que aumentan la presión abdominal: Obesidad, embarazo, tos crónica (EPOC, tabaquismo), estreñimiento crónico.",
                    "Cirugía genitourinaria previa (prostatectomía).",
                    "Menopausia (cambios hormonales)."
                    ],
                    "manifestadoPor": [
                    "Informe del paciente sobre pérdida involuntaria de pequeñas cantidades de orina al toser, estornudar, reír, levantar peso o hacer ejercicio.",
                    "Observación de pérdida de orina durante maniobras que aumentan la presión abdominal."
                    ],
                    "resultadosEsperados": [
                    "El paciente reducirá o eliminará los episodios de incontinencia de estrés. (NOC 0502 Continencia urinaria)",
                    "El paciente demostrará la realización correcta de los ejercicios del suelo pélvico. (NOC 1810 Conocimiento: ejercicios prescritos)",
                    "El paciente identificará y evitará/modificará actividades que desencadenan la incontinencia.",
                    "El paciente verbalizará una mejora en su calidad de vida."
                    ],
                    "intervenciones": [
                    "Manejo de la Incontinencia Urinaria: de Esfuerzo (NIC 0610): Evaluar frecuencia y cantidad de las pérdidas. Identificar factores desencadenantes.",
                    "Ejercicios del Suelo Pélvico (NIC 0560): Enseñar al paciente a identificar y contraer correctamente los músculos del suelo pélvico (ejercicios de Kegel). Establecer pauta de ejercicios.",
                    "Entrenamiento de la Vejiga (NIC 0600): Considerar si coexiste con incontinencia de urgencia.",
                    "Manejo del Peso (NIC 1260): Fomentar la pérdida de peso si hay obesidad.",
                    "Enseñanza: Proceso de Enfermedad (NIC 5602): Educar sobre la causa, factores desencadenantes y opciones de tratamiento (conservador, farmacológico, quirúrgico).",
                    "Manejo de Líquidos (NIC 4120): Asegurar ingesta adecuada, evitar irritantes vesicales (cafeína, alcohol).",
                    "Uso de Dispositivos: Considerar el uso de pesarios vaginales o compresas absorbentes según necesidad.",
                    "Preparación para Cirugía (si aplica): Informar sobre procedimientos quirúrgicos correctores."
                    ]
                },
                {
                    "id": "00018",
                    "label": "Incontinencia urinaria refleja",
                    "definicion": "Pérdida involuntaria de orina a intervalos algo predecibles cuando se alcanza un volumen vesical específico.",
                    "relacionadoCon": [
                    "Lesión neurológica por encima del nivel del arco reflejo miccional sacro (lesión medular T12 o superior, esclerosis múltiple, tumores).",
                    "Deterioro tisular por radiación, cirugía radical pélvica o cistitis."
                    ],
                    "manifestadoPor": [
                    "Pérdida involuntaria de orina sin sensación de urgencia ni aviso previo.",
                    "Ausencia de sensación de necesidad de orinar.",
                    "Sensación de vejiga llena incompleta.",
                    "Contracciones o espasmos vesicales involuntarios a intervalos regulares.",
                    "Incapacidad para inhibir voluntariamente la micción.",
                    "Patrón de micción predecible (a intervalos regulares o cuando la vejiga alcanza cierto volumen)."
                    ],
                    "resultadosEsperados": [
                    "El paciente mantendrá la piel seca o gestionará eficazmente la incontinencia. (NOC 0502 Continencia urinaria)",
                    "El paciente vaciará la vejiga a intervalos regulares mediante técnicas apropiadas (sondaje intermitente, maniobras).",
                    "El paciente o cuidador demostrará el manejo del programa de vaciado vesical.",
                    "El paciente permanecerá libre de complicaciones (infección urinaria, lesión cutánea, disreflexia autonómica)."
                    ],
                    "intervenciones": [
                    "Manejo de la Eliminación Urinaria: Refleja (NIC 0590 / similar a Cuidados de la retención urinaria NIC 0620): Establecer programa de vaciado vesical programado.",
                    "Sondaje Vesical Intermitente (NIC 0580): Enseñar y/o realizar sondaje intermitente limpio (SIL) a intervalos regulares para prevenir llenado excesivo y pérdidas.",
                    "Entrenamiento del Hábito Urinario (NIC 0600): Intentar desencadenar la micción a horarios fijos (útil en algunos casos).",
                    "Monitorización de Signos de Disreflexia Autonómica (NIC 2620 / 6680): Vigilar HTA, bradicardia, cefalea, diaforesis (especialmente en lesiones medulares altas).",
                    "Cuidados del Catéter Urinario (si aplica NIC 1876): Mantener permeabilidad y asepsia si se usa sonda permanente.",
                    "Vigilancia de la Piel (NIC 3590): Prevenir dermatitis asociada a incontinencia.",
                    "Enseñanza: Procedimiento/Tratamiento (NIC 5618): Educar al paciente/familia sobre la condición y el manejo (SIL, signos de complicación)."
                    ]
                },
                {
                    "id": "00019",
                    "label": "Incontinencia urinaria de urgencia",
                    "definicion": "Pérdida involuntaria de orina asociada a una fuerte y súbita sensación de necesidad de orinar (urgencia).",
                    "relacionadoCon": [
                    "Hiperactividad del detrusor (contracciones involuntarias de la vejiga).",
                    "Infección del tracto urinario.",
                    "Irritación vesical (cálculos, tumores, cistitis intersticial).",
                    "Disminución de la capacidad vesical.",
                    "Ingesta de irritantes vesicales (cafeína, alcohol, bebidas carbonatadas).",
                    "Impactación fecal.",
                    "Efectos de medicación (diuréticos).",
                    "Trastornos neurológicos (Parkinson, ACV, esclerosis múltiple, demencia)."
                    ],
                    "manifestadoPor": [
                    "Informe del paciente sobre pérdida involuntaria de orina precedida por una urgencia miccional súbita e intensa.",
                    "Incapacidad para llegar al baño a tiempo.",
                    "Frecuencia urinaria aumentada (polaquiuria).",
                    "Nicturia (necesidad de orinar por la noche despertando al paciente).",
                    "Contracciones/espasmos vesicales observados o referidos."
                    ],
                    "resultadosEsperados": [
                    "El paciente reducirá o eliminará los episodios de incontinencia de urgencia. (NOC 0502 Continencia urinaria)",
                    "El paciente aumentará el intervalo entre micciones. (NOC 0503 Eliminación urinaria)",
                    "El paciente demostrará técnicas para controlar la urgencia (ejercicios suelo pélvico, técnicas de distracción). (NOC 1609 Conducta de cumplimiento: medicación / NOC 1810 Conocimiento: ejercicios prescritos)",
                    "El paciente identificará y evitará irritantes vesicales."
                    ],
                    "intervenciones": [
                    "Manejo de la Incontinencia Urinaria: de Urgencia (NIC 0610): Evaluar patrón miccional, factores desencadenantes, ingesta de líquidos.",
                    "Entrenamiento de la Vejiga (NIC 0600): Establecer programa de micción programada con aumento progresivo del intervalo. Enseñar técnicas de supresión de la urgencia (contracciones rápidas del suelo pélvico, distracción mental).",
                    "Ejercicios del Suelo Pélvico (NIC 0560): Enseñar ejercicios de Kegel para fortalecer musculatura y ayudar a inhibir contracciones.",
                    "Manejo de Líquidos (NIC 4120): Asegurar ingesta adecuada pero evitar sobrecarga. Reducir ingesta antes de dormir. Evitar irritantes vesicales.",
                    "Administración de Medicación (NIC 2300): Administrar anticolinérgicos/antimuscarínicos según prescripción.",
                    "Manejo Ambiental (NIC 6480): Asegurar acceso fácil al baño.",
                    "Enseñanza: Proceso de Enfermedad (NIC 5602): Educar sobre la condición, tratamiento y manejo.",
                    "Manejo del Estreñimiento (NIC 0450): Prevenir/tratar impactación fecal."
                    ]
                },
                {
                    "id": "00020",
                    "label": "Incontinencia urinaria funcional",
                    "definicion": "Incapacidad de una persona habitualmente continente para llegar al baño a tiempo para evitar la pérdida involuntaria de orina.",
                    "relacionadoCon": [
                    "Deterioro de la movilidad física (incapacidad para levantarse, caminar, desvestirse).",
                    "Deterioro cognitivo (demencia, confusión, incapacidad para reconocer la necesidad de orinar o localizar el baño).",
                    "Barreras ambientales (obstáculos, distancia al baño, cama alta, falta de ayudas para la movilidad).",
                    "Deterioro de la visión.",
                    "Debilidad o fatiga extremas.",
                    "Factores psicológicos (depresión, falta de motivación).",
                    "Restricciones físicas (sujeciones)."
                    ],
                    "manifestadoPor": [
                    "Pérdida de orina antes de llegar al baño.",
                    "Capacidad para reconocer la necesidad de orinar.",
                    "Continencia parcial (continente durante el día pero no por la noche, o viceversa).",
                    "Capacidad vesical normal y función del tracto urinario inferior intacta (inicialmente)."
                    ],
                    "resultadosEsperados": [
                    "El paciente reducirá o eliminará los episodios de incontinencia funcional. (NOC 0502 Continencia urinaria)",
                    "El paciente utilizará estrategias o dispositivos para compensar las limitaciones funcionales/ambientales. (NOC 0300 Autocuidados: actividades de la vida diaria)",
                    "El entorno del paciente estará adaptado para facilitar el acceso al baño. (NOC 1910 Ambiente seguro en el hogar)",
                    "El paciente mantendrá la dignidad y la integridad cutánea."
                    ],
                    "intervenciones": [
                    "Manejo de la Incontinencia Urinaria: Funcional (NIC 0610): Evaluar factores funcionales, cognitivos y ambientales que contribuyen.",
                    "Manejo Ambiental: Seguridad y Accesibilidad (NIC 6486 / 6480): Modificar entorno (eliminar obstáculos, buena iluminación, barras de apoyo, asiento de inodoro elevado). Proporcionar dispositivos de ayuda (andador, silla-inodoro portátil).",
                    "Ayuda con los Autocuidados: Aseo (NIC 1804): Asistir al paciente para ir al baño a intervalos regulares o cuando lo solicite. Ayudar con la ropa.",
                    "Entrenamiento del Hábito Urinario (NIC 0470): Establecer horario de micción programada basado en el patrón habitual del paciente.",
                    "Vestimenta Adaptada: Usar ropa fácil de quitar (cinturas elásticas, velcro).",
                    "Vigilancia (NIC 6650): Estar atento a las señales no verbales de necesidad de orinar en pacientes con deterioro cognitivo.",
                    "Uso de Dispositivos Absorbentes: Utilizar pañales o compresas si es necesario, cambiando frecuentemente para proteger la piel y mantener la dignidad."
                    ]
                },
                {
                    "id": "00021",
                    "label": "Incontinencia urinaria total",
                    "definicion": "Pérdida de orina continua e impredecible. (Nota: Diagnóstico retirado por NANDA-I, usar diagnósticos más específicos como Incontinencia Urinaria Continua 00293 u otros según la causa).",
                    "relacionadoCon": [
                    "Disfunción neurológica que causa pérdida del control del esfínter y/o reflejo vesical.",
                    "Fístula vesicovaginal o ureterovaginal.",
                    "Daño anatómico severo del esfínter uretral (trauma, cirugía radical).",
                    "Anomalías congénitas (extrofia vesical)."
                    ],
                    "manifestadoPor": [
                    "Flujo constante de orina a intervalos impredecibles.",
                    "Ausencia de distensión vesical.",
                    "Pérdida de orina nocturna.",
                    "Paciente a menudo inconsciente de la incontinencia.",
                    "Falta de respuesta a los programas de entrenamiento vesical o del hábito."
                    ],
                    "resultadosEsperados": [
                    "El paciente mantendrá la piel perianal/genital intacta. (NOC 1101 Integridad tisular: piel y membranas mucosas)",
                    "El paciente o cuidador manejará eficazmente la incontinencia utilizando dispositivos/productos adecuados. (NOC 0310 Autocuidados: manejo de la incontinencia)",
                    "El paciente mantendrá la dignidad y la comodidad.",
                    "El paciente permanecerá libre de infección del tracto urinario."
                    ],
                    "intervenciones": [
                    "Cuidados de la Incontinencia Urinaria (NIC 0610): Evaluar patrón y causa. Enfocarse en el manejo de la pérdida de orina y protección de la piel.",
                    "Cuidados Perineales (NIC 1750): Mantener la piel limpia y seca. Limpiar frecuentemente. Usar cremas barrera.",
                    "Manejo de Dispositivos para Incontinencia: Utilizar pañales absorbentes de alta capacidad, colectores externos (condón urinario en hombres), o considerar sondaje vesical permanente si otras medidas fallan y está indicado.",
                    "Cuidados del Catéter Urinario (si aplica NIC 1876): Mantener sistema cerrado, asegurar flujo, prevenir infecciones.",
                    "Vigilancia de la Piel (NIC 3590): Inspeccionar regularmente la piel en busca de signos de irritación o lesión.",
                    "Manejo de Líquidos (NIC 4120): Asegurar ingesta adecuada para mantener flujo urinario y prevenir ITU, pero evitar sobrecarga.",
                    "Apoyo Emocional (NIC 5270): Ayudar al paciente a afrontar el impacto de la incontinencia en la imagen corporal y autoestima."
                    ]
                },
                {
                    "id": "00022",
                    "label": "Riesgo de incontinencia urinaria de urgencia",
                    "definicion": "Susceptible a la pérdida involuntaria de orina asociada con una fuerte y súbita sensación de necesidad de orinar (urgencia), que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Efectos de medicaciones (diuréticos, anticolinérgicos).",
                    "Debilidad de los músculos pélvicos.",
                    "Hábitos de eliminación inadecuados (retrasar voluntariamente la micción).",
                    "Ingesta de irritantes vesicales (alcohol, cafeína, edulcorantes artificiales, bebidas carbonatadas).",
                    "Impactación fecal.",
                    "Hiperactividad del detrusor.",
                    "Infección del tracto urinario.",
                    "Patología vesical (cistitis, tumores)."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente identificará factores de riesgo individuales para la incontinencia de urgencia. (NOC 1805 Conocimiento: régimen terapéutico)",
                    "El paciente describirá y aplicará estrategias preventivas. (NOC 1609 Conducta de cumplimiento)",
                    "El paciente mantendrá la continencia urinaria. (NOC 0502 Continencia urinaria)",
                    "El paciente evitará o limitará la ingesta de irritantes vesicales conocidos."
                    ],
                    "intervenciones": [
                    "Identificación de Riesgos (NIC 6610): Evaluar factores de riesgo (dieta, medicación, historial médico, patrón miccional).",
                    "Enseñanza: Proceso de Enfermedad (NIC 5602): Educar sobre factores de riesgo y medidas preventivas.",
                    "Manejo de Líquidos (NIC 4120): Aconsejar sobre ingesta adecuada y evitar irritantes vesicales.",
                    "Manejo de la Eliminación Urinaria (NIC 0590): Fomentar vaciado vesical regular y completo. Desaconsejar el retraso voluntario de la micción.",
                    "Ejercicios del Suelo Pélvico (NIC 0560): Enseñar ejercicios de Kegel como medida preventiva para fortalecer musculatura.",
                    "Manejo del Estreñimiento (NIC 0450): Prevenir impactación fecal.",
                    "Vigilancia (NIC 6650): Monitorizar patrón miccional y signos precoces de ITU o irritación vesical."
                    ]
                },
                {
                    "id": "00023",
                    "label": "Retención urinaria",
                    "definicion": "Vaciado incompleto de la vejiga.",
                    "relacionadoCon": [
                    "Obstrucción del tracto de salida vesical (hiperplasia prostática benigna, estenosis uretral, fecaloma).",
                    "Hipocontractilidad del detrusor (lesión medular, vejiga neurogénica, neuropatía diabética, efectos de anestesia).",
                    "Medicación (anticolinérgicos, opiáceos, antihistamínicos).",
                    "Infección del tracto urinario.",
                    "Inhibición del arco reflejo miccional (dolor, miedo, ansiedad)."
                    ],
                    "manifestadoPor": [
                    "Ausencia de diuresis o diuresis escasa.",
                    "Distensión vesical (globo vesical palpable/percutible).",
                    "Sensación de vejiga llena.",
                    "Goteo o chorro débil/interrumpido.",
                    "Disuria.",
                    "Polaquiuria (micciones frecuentes de pequeño volumen).",
                    "Urgencia miccional.",
                    "Incontinencia por rebosamiento.",
                    "Residuo postmiccional elevado (medido por ecografía o sondaje)."
                    ],
                    "resultadosEsperados": [
                    "El paciente vaciará la vejiga completamente o tendrá un residuo postmiccional mínimo (<50-100 ml). (NOC 0503 Eliminación urinaria)",
                    "El paciente no presentará globo vesical palpable.",
                    "El paciente referirá ausencia de sensación de plenitud vesical o urgencia después de la micción.",
                    "El paciente mantendrá un patrón de micción regular y con volumen adecuado.",
                    "El paciente permanecerá libre de infección del tracto urinario."
                    ],
                    "intervenciones": [
                    "Cuidados de la Retención Urinaria (NIC 0620): Monitorizar ingesta y eliminación. Palpar/percutir vejiga. Medir residuo postmiccional.",
                    "Sondaje Vesical (NIC 0580): Realizar sondaje vesical intermitente según pauta o sondaje permanente si está indicado/prescrito. Utilizar técnica aséptica.",
                    "Estimulación del Reflejo Miccional: Proporcionar privacidad. Utilizar estímulos (agua corriente, calor suprapúbico). Maniobra de Credé (si no está contraindicada).",
                    "Manejo de la Medicación (NIC 2380): Revisar medicación que pueda causar retención. Administrar medicamentos para estimular la contracción vesical (colinérgicos) o relajar el esfínter si están prescritos.",
                    "Manejo de Líquidos (NIC 4120): Fomentar ingesta adecuada de líquidos si no está contraindicado.",
                    "Prevención de Infecciones (NIC 6550): Mantener higiene perineal. Cuidado aséptico del catéter.",
                    "Enseñanza: Procedimiento/Tratamiento (NIC 5618): Educar al paciente/familia sobre la causa, manejo (autosondaje si aplica) y signos de complicación (ITU)."
                    ]
                },
                {
                    "id": "00027",
                    "label": "Déficit de volumen de líquidos",
                    "definicion": "Disminución del líquido intravascular, intersticial y/o intracelular. Se refiere a la deshidratación, pérdida de agua sola sin cambio en el sodio.",
                    "relacionadoCon": [
                    "Pérdida activa de volumen de líquidos (hemorragia, vómitos, diarrea, aspiración gástrica, diuresis excesiva por diuréticos o diabetes insípida/mellitus no controlada, sudoración profusa, quemaduras).",
                    "Aporte insuficiente de líquidos (incapacidad para ingerir líquidos, náuseas, anorexia, falta de acceso a agua).",
                    "Secuestro de líquidos (tercer espacio: ascitis, edema masivo)."
                    ],
                    "manifestadoPor": [
                    "Disminución de la turgencia cutánea, piel y mucosas secas.",
                    "Sed.",
                    "Debilidad, mareo, síncope.",
                    "Disminución de la diuresis (oliguria), orina concentrada.",
                    "Hipotensión ortostática o postural.",
                    "Taquicardia.",
                    "Disminución del llenado capilar.",
                    "Disminución de la presión venosa central (PVC) y presión de enclavamiento pulmonar (PCP).",
                    "Aumento del hematocrito.",
                    "Aumento de la concentración de urea/sodio sérico (en deshidratación hipertónica).",
                    "Pérdida de peso aguda.",
                    "Alteración del estado mental (confusión, letargia)."
                    ],
                    "resultadosEsperados": [
                    "El paciente alcanzará y mantendrá un estado de hidratación adecuado. (NOC 0602 Hidratación)",
                    "El paciente mostrará constantes vitales estables (PA, FC dentro de límites normales, ausencia de hipotensión ortostática). (NOC 0401 Estado circulatorio)",
                    "El paciente mantendrá una diuresis adecuada (>30 ml/hora o 0.5 ml/kg/hora). (NOC 0503 Eliminación urinaria)",
                    "El paciente mostrará turgencia cutánea normal y mucosas húmedas.",
                    "El paciente tendrá valores de laboratorio (hematocrito, electrolitos, urea) dentro de límites normales."
                    ],
                    "intervenciones": [
                    "Manejo de Líquidos (NIC 4120): Monitorizar estrictamente ingesta y eliminación. Pesar diariamente. Vigilar signos vitales, turgencia cutánea, mucosas.",
                    "Monitorización de Líquidos (NIC 4130): Evaluar signos de hipovolemia (hipotensión, taquicardia, oliguria). Controlar parámetros hemodinámicos (PVC, PCP si disponibles).",
                    "Terapia Intravenosa (IV) (NIC 4200): Administrar líquidos IV (cristaloides, coloides) según prescripción para reponer volumen.",
                    "Manejo de Electrolitos (NIC 2080): Monitorizar y corregir desequilibrios electrolíticos asociados.",
                    "Fomento de la Ingesta Oral: Animar la ingesta de líquidos orales si el paciente tolera.",
                    "Manejo del Vómito/Diarrea (NIC 1450 / 0460): Administrar antieméticos/antidiarreicos según prescripción. Reponer pérdidas.",
                    "Cuidados de la Boca (NIC 1710): Mantener mucosas orales húmedas.",
                    "Prevención de Caídas (NIC 6490): Debido al riesgo por mareo/debilidad/hipotensión."
                    ]
                },
                {
                    "id": "00028",
                    "label": "Riesgo de déficit de volumen de líquidos",
                    "definicion": "Susceptible a experimentar una disminución del volumen de líquido intravascular, intersticial y/o intracelular, que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Pérdidas excesivas a través de vías normales (diarrea, diaforesis intensa) o anormales (hemorragia, drenajes, vómitos).",
                    "Aporte insuficiente de líquidos (náuseas, anorexia, dificultad para deglutir, falta de acceso, confusión).",
                    "Factores que influyen en las necesidades de líquidos (fiebre, hipermetabolismo, ejercicio intenso, exposición a calor extremo).",
                    "Edades extremas (lactantes, ancianos).",
                    "Uso de medicación (diuréticos).",
                    "Pérdida de peso extrema, caquexia.",
                    "Desviaciones que afectan a la absorción de líquidos (enfermedad inflamatoria intestinal)."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente mantendrá un estado de hidratación adecuado. (NOC 0602 Hidratación)",
                    "El paciente mantendrá un equilibrio entre ingesta y eliminación de líquidos. (NOC 0601 Equilibrio hídrico)",
                    "El paciente identificará factores de riesgo personales para el déficit de volumen. (NOC 1805 Conocimiento: régimen terapéutico)",
                    "El paciente consumirá una cantidad adecuada de líquidos diariamente.",
                    "El paciente no mostrará signos ni síntomas de deshidratación."
                    ],
                    "intervenciones": [
                    "Manejo de Líquidos (NIC 4120): Monitorizar ingesta y eliminación. Pesar diariamente. Animar a la ingesta de líquidos adecuada (establecer objetivos). Ofrecer líquidos preferidos.",
                    "Vigilancia (NIC 6650): Estar atento a signos precoces de deshidratación (sed, mucosas secas, oliguria leve). Vigilar constantes vitales.",
                    "Identificación de Riesgos (NIC 6610): Evaluar factores de riesgo individuales.",
                    "Enseñanza: Dieta/Líquidos Prescritos (NIC 5614): Educar al paciente/familia sobre la importancia de la hidratación y las necesidades individuales de líquidos.",
                    "Manejo Ambiental: Facilitar acceso a líquidos. Proporcionar pajitas, vasos adaptados si es necesario.",
                    "Manejo de Náuseas/Vómitos (NIC 1450): Tratar náuseas para mejorar la ingesta oral.",
                    "Terapia Intravenosa (IV) (NIC 4200): Mantener acceso IV permeable si hay alto riesgo o dificultad para la ingesta oral."
                    ]
                },
                {
                    "id": "00026",
                    "label": "Exceso de volumen de líquidos",
                    "definicion": "Aumento de la retención de líquidos isotónicos.",
                    "relacionadoCon": [
                    "Mecanismos de regulación comprometidos (insuficiencia cardíaca, insuficiencia renal, síndrome nefrótico, cirrosis hepática).",
                    "Exceso de aporte de líquidos.",
                    "Exceso de aporte de sodio.",
                    "Tratamiento con corticoides.",
                    "Reacción a transfusión."
                    ],
                    "manifestadoPor": [
                    "Edema (periférico, anasarca, periorbitario).",
                    "Aumento de peso en corto período de tiempo.",
                    "Disnea, ortopnea, disnea paroxística nocturna.",
                    "Sonidos respiratorios adventicios (crepitantes).",
                    "Distensión venosa yugular.",
                    "Reflujo hepatoyugular positivo.",
                    "Aumento de la presión venosa central (PVC).",
                    "Disminución del hematocrito y/o de la hemoglobina (por hemodilución).",
                    "Electrolitos pueden estar diluidos (hiponatremia dilucional).",
                    "Oliguria (si es por fallo renal) o diuresis normal/aumentada (si es por sobrecarga iatrogénica con función renal normal).",
                    "Hipertensión arterial.",
                    "Ansiedad, agitación.",
                    "Patrón respiratorio alterado.",
                    "Derrame pleural, ascitis.",
                    "Cambios en el estado mental."
                    ],
                    "resultadosEsperados": [
                    "El paciente alcanzará y mantendrá un equilibrio hídrico adecuado (euvolemia). (NOC 0601 Equilibrio hídrico)",
                    "El paciente mostrará ausencia o disminución de edema. (NOC 0601)",
                    "El paciente mantendrá sonidos pulmonares limpios y patrón respiratorio eficaz. (NOC 0415 Estado respiratorio)",
                    "El paciente mostrará constantes vitales y parámetros hemodinámicos dentro de límites normales.",
                    "El paciente verbalizará comprensión de las restricciones de líquidos y sodio."
                    ],
                    "intervenciones": [
                    "Manejo de Líquidos/Electrolitos (NIC 2080): Monitorizar estrictamente ingesta y eliminación. Pesar diariamente (misma hora, misma báscula, misma ropa). Restringir líquidos y sodio según prescripción.",
                    "Monitorización de Líquidos (NIC 4130): Evaluar signos de sobrecarga (edema, distensión yugular, disnea, crepitantes). Controlar PVC si disponible.",
                    "Monitorización Respiratoria (NIC 3350): Auscultar pulmones. Vigilar patrón respiratorio y saturación de oxígeno.",
                    "Administración de Medicación: Diuréticos (NIC 2300 / 2313): Administrar diuréticos según prescripción. Vigilar respuesta (diuresis) y efectos secundarios (hipopotasemia, hipotensión).",
                    "Cuidados Cardíacos (NIC 4040): Monitorizar ritmo y frecuencia cardíaca, presión arterial.",
                    "Cuidados de la Piel (NIC 3590): Prevenir lesiones cutáneas en zonas edematosas. Elevar extremidades.",
                    "Posicionamiento (NIC 0840): Colocar en posición semi-Fowler para facilitar respiración.",
                    "Enseñanza: Dieta/Líquidos Prescritos (NIC 5614): Educar sobre la importancia de las restricciones."
                    ]
                },
                {
                    "id": "00025",
                    "label": "Riesgo de desequilibrio de volumen de líquidos",
                    "definicion": "Susceptible a una disminución, aumento o cambio rápido de un espacio a otro del líquido intravascular, intersticial y/o intracelular, que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Cirugía mayor.",
                    "Traumatismo.",
                    "Sepsis.",
                    "Quemaduras.",
                    "Insuficiencia renal, cardíaca o hepática.",
                    "Obstrucción intestinal.",
                    "Pancreatitis.",
                    "Diabetes insípida o SIADH (Síndrome de Secreción Inadecuada de ADH).",
                    "Tratamientos (diuréticos, diálisis, nutrición parenteral total, quimioterapia, cirugía).",
                    "Condiciones que afectan el aporte o la pérdida de líquidos (vómitos/diarrea severos, ayuno prolongado, polidipsia).",
                    "Edades extremas."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente mantendrá un equilibrio de volumen de líquidos adecuado. (NOC 0601 Equilibrio hídrico)",
                    "El paciente mostrará constantes vitales y parámetros hemodinámicos estables.",
                    "El paciente mantendrá un peso estable.",
                    "El paciente no mostrará signos ni síntomas de déficit o exceso de volumen de líquidos.",
                    "El paciente o cuidador identificará factores de riesgo y signos precoces de desequilibrio."
                    ],
                    "intervenciones": [
                    "Manejo de Líquidos (NIC 4120): Monitorización estricta de ingesta (oral, IV, NPT) y eliminación (orina, drenajes, vómitos, diarrea). Pesar diariamente.",
                    "Monitorización de Líquidos (NIC 4130): Vigilar signos vitales, presión venosa central (si aplica), signos de hipovolemia o hipervolemia (turgencia cutánea, edema, mucosas, estado respiratorio, estado mental).",
                    "Vigilancia (NIC 6650): Estar alerta a cambios rápidos en el estado del paciente.",
                    "Manejo de Electrolitos (NIC 2080): Monitorizar electrolitos séricos y corregir desequilibrios según prescripción.",
                    "Terapia Intravenosa (IV) (NIC 4200): Administrar líquidos IV con precaución, ajustando ritmo según respuesta y estado del paciente.",
                    "Identificación de Riesgos (NIC 6610): Evaluar factores de riesgo individuales.",
                    "Comunicación Interdisciplinar: Colaborar con el equipo médico para ajustar el plan de manejo de líquidos según la evolución.",
                    "Enseñanza: Proceso de Enfermedad/Tratamiento (NIC 5602 / 5618): Educar al paciente/familia sobre la condición, los signos de alerta y el plan de tratamiento."
                    ]
                },
                {
                    "id": "00195",
                    "label": "Riesgo de desequilibrio electrolítico",
                    "definicion": "Susceptible a cambios en los niveles de electrolitos séricos, que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Disfunción renal.",
                    "Disfunción endocrina (diabetes insípida, SIADH, hiperparatiroidismo, hipoaldosteronismo).",
                    "Vómitos, diarrea, aspiración gástrica.",
                    "Desequilibrio de volumen de líquidos (déficit o exceso).",
                    "Quemaduras extensas.",
                    "Malnutrición, ayuno.",
                    "Traumatismo tisular.",
                    "Régimen terapéutico (diuréticos, corticoides, líquidos IV, quimioterapia, diálisis)."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente mantendrá los niveles de electrolitos séricos (Sodio, Potasio, Calcio, Magnesio, Cloro, Fosfato) dentro de los límites normales. (NOC 0600 Equilibrio electrolítico)",
                    "El paciente permanecerá libre de signos y síntomas de desequilibrio electrolítico (arritmias, debilidad muscular, calambres, confusión, convulsiones).",
                    "El paciente o cuidador identificará factores de riesgo y signos precoces de desequilibrio."
                    ],
                    "intervenciones": [
                    "Manejo de Electrolitos (NIC 2080): Monitorizar niveles de electrolitos séricos según pauta/necesidad. Observar signos y síntomas de desequilibrio (neurológicos, cardíacos, neuromusculares).",
                    "Monitorización de Líquidos (NIC 4130): Mantener registro preciso de ingesta y eliminación, ya que el volumen de líquidos afecta la concentración de electrolitos.",
                    "Administración de Medicación/Soluciones IV (NIC 2300 / 4200): Administrar suplementos de electrolitos o soluciones IV según prescripción, con precaución y monitorización.",
                    "Manejo Ácido-Base (NIC 191x): Monitorizar equilibrio ácido-base, ya que a menudo se asocia con desequilibrios electrolíticos.",
                    "Manejo de la Diarrea/Vómito (NIC 0460 / 1450): Controlar pérdidas gastrointestinales que pueden causar pérdida de electrolitos.",
                    "Vigilancia (NIC 6650): Monitorizar respuesta a tratamientos y detectar cambios tempranos.",
                    "Enseñanza: Proceso de Enfermedad/Tratamiento (NIC 5602 / 5618): Educar al paciente/familia sobre la importancia de la dieta, medicación y signos de alerta."
                    ]
                },
                {
                    "id": "00002",
                    "label": "Desequilibrio nutricional: ingesta inferior a las necesidades",
                    "definicion": "Ingesta de nutrientes insuficiente para satisfacer las necesidades metabólicas.",
                    "relacionadoCon": [
                    "Incapacidad para ingerir o digerir alimentos o absorber nutrientes debido a factores biológicos, psicológicos o económicos.",
                    "Factores biológicos: Disfagia, anorexia, náuseas/vómitos, enfermedad crónica (cáncer, EPOC, insuficiencia renal/cardíaca), cirugía gastrointestinal, problemas dentales, aumento de las necesidades metabólicas (infección, quemaduras, hipertiroidismo).",
                    "Factores psicológicos: Depresión, ansiedad, trastornos alimentarios.",
                    "Factores económicos: Ingresos insuficientes, falta de acceso a alimentos nutritivos.",
                    "Falta de información sobre necesidades nutricionales."
                    ],
                    "manifestadoPor": [
                    "Peso corporal inferior en un 20% o más al peso ideal o pérdida de peso significativa no intencionada.",
                    "Ingesta alimentaria inferior a las raciones diarias recomendadas (RDA) o a las necesidades calculadas.",
                    "Debilidad muscular, fatiga.",
                    "Pérdida de masa muscular.",
                    "Piel seca, pérdida de cabello.",
                    "Irritabilidad, confusión.",
                    "Valores de laboratorio anormales (albúmina sérica baja, prealbúmina baja, linfocitos bajos, anemia).",
                    "Mucosas pálidas.",
                    "Informe de falta de alimentos o falta de interés en la comida."
                    ],
                    "resultadosEsperados": [
                    "El paciente alcanzará y mantendrá un peso corporal adecuado para su edad/talla. (NOC 1004 Estado nutricional)",
                    "El paciente demostrará una ingesta adecuada de nutrientes. (NOC 1009 Estado nutricional: ingestión de nutrientes)",
                    "El paciente tendrá valores de laboratorio relacionados con la nutrición dentro de límites normales.",
                    "El paciente verbalizará comprensión de sus necesidades nutricionales y plan dietético.",
                    "El paciente mostrará mejora en la fuerza y nivel de energía."
                    ],
                    "intervenciones": [
                    "Manejo de la Nutrición (NIC 1100): Valorar estado nutricional (peso, talla, IMC, historial dietético, parámetros de laboratorio). Determinar necesidades calóricas y nutricionales. Colaborar con dietista.",
                    "Ayuda para Ganar Peso (NIC 1240): Establecer plan de comidas hipercalórico/hiperproteico. Ofrecer comidas pequeñas y frecuentes. Fomentar alimentos preferidos y densos en nutrientes.",
                    "Monitorización Nutricional (NIC 1160): Controlar ingesta de alimentos y líquidos. Pesar regularmente.",
                    "Manejo de Trastornos de la Alimentación (NIC 1030): Si aplica, implementar plan específico.",
                    "Alimentación Enteral por Sonda (NIC 1056) / Nutrición Parenteral Total (NPT) (NIC 1020): Administrar y monitorizar si la vía oral es insuficiente/imposible.",
                    "Manejo del Vómito/Náuseas (NIC 1450 / 1570): Tratar síntomas que interfieren con la ingesta.",
                    "Enseñanza: Dieta Prescrita (NIC 5614): Educar al paciente/familia sobre el plan nutricional.",
                    "Asesoramiento Nutricional (NIC 5246): Proporcionar información y apoyo para mejorar hábitos alimentarios."
                    ]
                },
                {
                    "id": "00232",
                    "label": "Obesidad",
                    "definicion": "Condición en la que un individuo acumula grasa corporal excesiva o anormal hasta el punto que puede tener un efecto adverso en la salud.",
                    "relacionadoCon": [
                    "Desequilibrio entre ingesta calórica y gasto energético.",
                    "Consumo excesivo de alimentos ricos en energía (grasas, azúcares).",
                    "Conductas sedentarias.",
                    "Factores genéticos, metabólicos o endocrinos (hipotiroidismo, síndrome de Cushing).",
                    "Factores psicológicos (comer en respuesta a emociones, estrés, depresión).",
                    "Factores socioculturales (hábitos alimentarios familiares/culturales, disponibilidad de alimentos poco saludables).",
                    "Uso de ciertos medicamentos (corticoides, antidepresivos)."
                    ],
                    "manifestadoPor": [
                    "Índice de Masa Corporal (IMC) ≥ 30 kg/m² en adultos.",
                    "Percentil de IMC ≥ 95 para edad y sexo en niños/adolescentes.",
                    "Peso corporal >20% por encima del peso ideal.",
                    "Circunferencia de cintura elevada (indicador de grasa abdominal).",
                    "Patrones alimentarios disfuncionales (comer en ausencia de hambre, comer grandes cantidades).",
                    "Sedentarismo.",
                    "Puede haber disnea de esfuerzo, fatiga."
                    ],
                    "resultadosEsperados": [
                    "El paciente logrará y mantendrá una reducción de peso corporal o IMC hacia rangos más saludables. (NOC 1006 Peso: masa corporal)",
                    "El paciente modificará sus hábitos alimentarios hacia opciones más saludables y control de porciones. (NOC 1622 Conducta de cumplimiento: dieta prescrita)",
                    "El paciente aumentará su nivel de actividad física. (NOC 1632 Conducta de cumplimiento: actividad prescrita)",
                    "El paciente verbalizará comprensión de los riesgos asociados a la obesidad y las estrategias para el manejo del peso.",
                    "El paciente desarrollará estrategias de afrontamiento saludables para el manejo de emociones sin recurrir a la comida."
                    ],
                    "intervenciones": [
                    "Manejo del Peso (NIC 1260): Ayudar al paciente a identificar metas realistas de pérdida de peso. Desarrollar un plan conjunto de dieta y ejercicio.",
                    "Asesoramiento Nutricional (NIC 5246): Educar sobre principios de nutrición equilibrada, lectura de etiquetas, tamaño de porciones, elección de alimentos saludables.",
                    "Fomento del Ejercicio (NIC 0200): Ayudar a establecer un programa de actividad física gradual y sostenible.",
                    "Modificación de la Conducta (NIC 4360): Utilizar técnicas como autorregistro de ingesta/actividad, establecimiento de metas, manejo de estímulos, refuerzo positivo.",
                    "Apoyo Emocional (NIC 5270): Explorar la relación entre emociones y comida. Fomentar estrategias de afrontamiento alternativas.",
                    "Enseñanza: Dieta Prescrita/Actividad Física (NIC 5614 / 5612): Proporcionar información clara y recursos.",
                    "Monitorización del Peso (NIC 1160): Pesar regularmente.",
                    "Derivación: Considerar derivación a dietista, psicólogo, grupo de apoyo o programa de manejo de peso."
                    ]
                },
                {
                    "id": "00003",
                    "label": "Riesgo de desequilibrio nutricional por exceso",
                    "definicion": "Susceptible a una ingesta de nutrientes que excede las necesidades metabólicas, que puede comprometer la salud. (Nota: Código antiguo, concepto similar a 00234 Riesgo de sobrepeso)",
                    "relacionadoCon": [
                    "Consumo de bebidas azucaradas.",
                    "Consumo frecuente de comidas fuera de casa o alimentos procesados.",
                    "Patrones alimentarios disfuncionales (comer en respuesta a estímulos externos o internos distintos del hambre).",
                    "Tamaño de las porciones mayor que el recomendado.",
                    "Nivel de actividad física inferior al recomendado.",
                    "Conocimientos deficientes sobre el valor nutricional de los alimentos.",
                    "Factores psicológicos (ansiedad, aburrimiento, estrés).",
                    "Factores socioculturales que promueven el consumo excesivo."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente mantendrá un peso corporal dentro de límites saludables. (NOC 1006 Peso: masa corporal)",
                    "El paciente identificará factores de riesgo personales para el aumento de peso. (NOC 1805 Conocimiento: régimen terapéutico)",
                    "El paciente seleccionará alimentos y porciones adecuadas a sus necesidades energéticas. (NOC 1622 Conducta de cumplimiento: dieta prescrita)",
                    "El paciente mantendrá un nivel adecuado de actividad física. (NOC 1632 Conducta de cumplimiento: actividad prescrita)",
                    "El paciente no desarrollará sobrepeso u obesidad."
                    ],
                    "intervenciones": [
                    "Asesoramiento Nutricional (NIC 5246): Educar sobre necesidades calóricas, equilibrio nutricional, lectura de etiquetas, elección de alimentos saludables y control de porciones.",
                    "Fomento del Ejercicio (NIC 0200): Promover la actividad física regular.",
                    "Identificación de Riesgos (NIC 6610): Ayudar al paciente a identificar sus propios factores de riesgo (hábitos, entorno, emociones).",
                    "Modificación de la Conducta (NIC 4360): Enseñar estrategias para manejar estímulos que incitan a comer en exceso, planificar comidas, técnicas de afrontamiento.",
                    "Enseñanza: Dieta Prescrita/Actividad Física (NIC 5614 / 5612): Proporcionar información y recursos.",
                    "Vigilancia del Peso (NIC 1160): Monitorizar peso periódicamente.",
                    "Fomento de la Autoconciencia: Animar al registro de ingesta y actividad para identificar patrones."
                    ]
                },
                {
                    "id": "00146",
                    "label": "Ansiedad",
                    "definicion": "Sensación vaga e intranquilizadora de malestar o amenaza acompañada de una respuesta autonómica (el origen de la cual con frecuencia es inespecífico o desconocido para la persona); sentimiento de aprensión causado por la anticipación de un peligro. Es una señal de alerta que advierte de un peligro inminente y permite a la persona tomar medidas para afrontar la amenaza.",
                    "relacionadoCon": [
                    "Amenaza para el autoconcepto, la salud, el estado socioeconómico, el rol o el patrón de interacción.",
                    "Amenaza de muerte.",
                    "Crisis situacionales o de maduración.",
                    "Estrés.",
                    "Necesidades no satisfechas.",
                    "Conflicto inconsciente sobre valores o metas esenciales.",
                    "Transmisión/contagio interpersonal.",
                    "Factores hereditarios.",
                    "Abuso de sustancias."
                    ],
                    "manifestadoPor": [
                    "Conductuales: Agitación psicomotora, inquietud, movimientos extraños, insomnio, contacto visual pobre, inhibición, preocupación.",
                    "Afectivos: Irritabilidad, aprensión, nerviosismo, miedo, angustia, sentirse impotente, exceso de preocupación, sensación de tensión.",
                    "Fisiológicos: Aumento de la tensión arterial, pulso y frecuencia respiratoria; diaforesis; temblores; tensión muscular; palpitaciones; molestias abdominales (náuseas, diarrea); boca seca; sofocos o escalofríos; voz temblorosa.",
                    "Cognitivos: Dificultad para concentrarse, bloqueo del pensamiento, confusión, olvidos, preocupación excesiva, miedo a perder el control, sensación de fatalidad inminente.",
                    "Sociales: Dificultad en las relaciones interpersonales."
                    ],
                    "resultadosEsperados": [
                    "El paciente demostrará control sobre la ansiedad (identificará factores desencadenantes, utilizará estrategias de afrontamiento). (NOC 1402 Autocontrol de la ansiedad)",
                    "El paciente referirá una disminución del nivel de ansiedad. (NOC 1211 Nivel de ansiedad)",
                    "El paciente mantendrá un patrón de sueño adecuado.",
                    "El paciente utilizará técnicas de relajación para reducir la ansiedad.",
                    "El paciente mantendrá la capacidad de concentración y toma de decisiones."
                    ],
                    "intervenciones": [
                    "Disminución de la Ansiedad (NIC 5820): Utilizar un enfoque sereno y tranquilizador. Permanecer con el paciente si es necesario. Escuchar activamente sus preocupaciones.",
                    "Aumentar el Afrontamiento (NIC 5230): Ayudar al paciente a identificar sus mecanismos de afrontamiento y a desarrollar otros nuevos y efectivos. Fomentar la expresión de sentimientos.",
                    "Técnicas de Relajación (NIC 5880): Enseñar y practicar técnicas como respiración profunda, relajación muscular progresiva, visualización guiada, meditación.",
                    "Apoyo Emocional (NIC 5270): Mostrar empatía, aceptación y comprensión. Ayudar a identificar pensamientos irracionales o distorsionados.",
                    "Manejo Ambiental: Confort (NIC 6482): Reducir estímulos ambientales estresantes. Proporcionar un entorno tranquilo.",
                    "Administración de Medicación: Ansiolíticos (NIC 2300): Administrar ansiolíticos según prescripción. Evaluar eficacia y efectos secundarios.",
                    "Presencia (NIC 5340): Estar físicamente presente y disponible para el paciente, demostrando interés y apoyo.",
                    "Enseñanza: Proceso de Enfermedad (NIC 5602): Explicar procedimientos y tratamientos para reducir la incertidumbre."
                    ]
                },
                {
                    "id": "00148",
                    "label": "Temor",
                    "definicion": "Respuesta a la percepción de una amenaza que se reconoce conscientemente como un peligro.",
                    "relacionadoCon": [
                    "Estímulo fóbico o fobia.",
                    "Respuesta aprendida (condicionamiento, imitación).",
                    "Separación del sistema de soporte en situación estresante.",
                    "Falta de familiaridad con la experiencia ambiental.",
                    "Amenaza percibida (real o imaginaria) a la integridad física o al bienestar (dolor, procedimientos invasivos, hospitalización, muerte).",
                    "Barreras idiomáticas.",
                    "Deterioro sensorial."
                    ],
                    "manifestadoPor": [
                    "Informe verbal de aprensión, tensión, pánico, terror.",
                    "Aumento de la alerta, sobresalto exagerado.",
                    "Conducta de evitación o ataque.",
                    "Enfoque limitado en la fuente del temor.",
                    "Fisiológicos: Aumento de la frecuencia cardíaca, respiratoria, presión arterial; diaforesis; dilatación pupilar; temblor; palidez; boca seca; anorexia, náuseas, vómitos, diarrea.",
                    "Cognitivos: Identificación del objeto del miedo.",
                    "Conductuales: Impulso de huir o escapar."
                    ],
                    "resultadosEsperados": [
                    "El paciente demostrará control sobre el temor (identificará la fuente, utilizará estrategias de afrontamiento). (NOC 1404 Autocontrol del miedo)",
                    "El paciente referirá una disminución del nivel de temor. (NOC 1210 Nivel del miedo)",
                    "El paciente afrontará la situación/objeto temido con apoyo y estrategias adecuadas.",
                    "El paciente mostrará disminución de las respuestas fisiológicas al temor."
                    ],
                    "intervenciones": [
                    "Disminución de la Ansiedad/Temor (NIC 5820 / similar): Permanecer con el paciente para promover seguridad. Ayudar a identificar la fuente específica del temor.",
                    "Aumentar el Afrontamiento (NIC 5230): Explorar estrategias de afrontamiento previas. Fomentar la verbalización de sentimientos. Ayudar a reevaluar la percepción de la amenaza.",
                    "Apoyo Emocional (NIC 5270): Mostrar empatía y aceptación. Validar el sentimiento de temor.",
                    "Presencia (NIC 5340): Estar disponible y transmitir seguridad.",
                    "Enseñanza: Procedimiento/Tratamiento (NIC 5618): Proporcionar información clara y precisa sobre situaciones o procedimientos temidos para reducir la incertidumbre.",
                    "Técnicas de Relajación (NIC 5880): Enseñar técnicas para reducir la respuesta fisiológica (respiración profunda).",
                    "Modificación de la Conducta (NIC 4360): Considerar técnicas como desensibilización sistemática si el temor es fóbico (requiere formación específica o derivación).",
                    "Manejo Ambiental: Seguridad (NIC 6486): Reducir estímulos atemorizantes si es posible."
                    ]
                },
                {
                    "id": "00126",
                    "label": "Conocimientos deficientes",
                    "definicion": "Carencia o deficiencia de información cognitiva relacionada con un tema específico.",
                    "relacionadoCon": [
                    "Falta de exposición a la información.",
                    "Interpretación errónea de la información.",
                    "Limitación cognitiva.",
                    "Falta de interés en el aprendizaje.",
                    "Falta de memoria.",
                    "Falta de familiaridad con los recursos de información.",
                    "Barreras idiomáticas.",
                    "Baja alfabetización en salud."
                    ],
                    "manifestadoPor": [
                    "Verbalización del problema (expresa no conocer o entender).",
                    "Seguimiento inexacto de las instrucciones.",
                    "Realización incorrecta de una conducta deseada (p. ej., técnica de autocuidado, toma de medicación).",
                    "Desarrollo de complicaciones prevenibles.",
                    "Expresión de percepciones erróneas sobre la salud.",
                    "Comportamientos inapropiados o exagerados (p. ej., hostilidad, agitación, apatía)."
                    ],
                    "resultadosEsperados": [
                    "El paciente verbalizará comprensión sobre [tema específico: enfermedad, tratamiento, autocuidado, etc.]. (NOC 18xx específico del tema, ej. NOC 1813 Conocimiento: régimen terapéutico, NOC 1803 Conocimiento: proceso de la enfermedad)",
                    "El paciente demostrará correctamente las habilidades/conductas relacionadas con [tema específico]. (NOC 18xx)",
                    "El paciente tomará decisiones informadas sobre su salud.",
                    "El paciente identificará y utilizará recursos de información fiables."
                    ],
                    "intervenciones": [
                    "Enseñanza: Proceso de Enfermedad (NIC 5602) / Régimen Terapéutico (NIC 5616) / Procedimiento (NIC 5618) / Dieta (NIC 5614) / Actividad (NIC 5612) / Medicamentos (NIC 5616): Evaluar conocimientos previos y disposición para aprender. Establecer objetivos de aprendizaje claros. Seleccionar métodos de enseñanza adecuados (verbal, escrito, demostración). Utilizar lenguaje claro y sencillo.",
                    "Facilitar el Aprendizaje (NIC 5520): Crear un ambiente propicio. Adaptar la enseñanza al nivel cognitivo y cultural del paciente. Utilizar material de apoyo (folletos, videos).",
                    "Escucha Activa (NIC 4920): Prestar atención a las preguntas y preocupaciones del paciente.",
                    "Evaluación del Aprendizaje: Verificar la comprensión mediante preguntas abiertas, solicitud de devolución de la información o demostración de habilidades.",
                    "Fomento de la Implicación Familiar (NIC 7110): Incluir a la familia en el proceso de enseñanza si es apropiado.",
                    "Identificación de Recursos: Proporcionar información sobre fuentes fiables (grupos de apoyo, sitios web, etc.)."
                    ]
                },
                {
                    "id": "00069",
                    "label": "Afrontamiento inefectivo",
                    "definicion": "Incapacidad para formular una apreciación válida de los agentes estresantes, elección inadecuada de respuestas practicadas y/o incapacidad para utilizar los recursos disponibles.",
                    "relacionadoCon": [
                    "Crisis situacionales o de maduración.",
                    "Alto grado de amenaza percibida.",
                    "Incertidumbre.",
                    "Vulnerabilidad personal.",
                    "Nivel de confianza inadecuado en la capacidad para afrontar la situación.",
                    "Apoyo social inadecuado.",
                    "Nivel de percepción de control inadecuado.",
                    "Alteración cognitiva.",
                    "Fatiga.",
                    "Trastorno del patrón de sueño."
                    ],
                    "manifestadoPor": [
                    "Resolución inadecuada de problemas.",
                    "Incapacidad para satisfacer las necesidades básicas o los roles.",
                    "Uso de formas de afrontamiento que impiden la conducta adaptativa (abuso de sustancias, negación, evitación, rumiación).",
                    "Alteración de la concentración.",
                    "Cambio en los patrones de comunicación.",
                    "Conducta destructiva hacia sí mismo o hacia otros.",
                    "Fatiga, trastornos del sueño.",
                    "Alto índice de enfermedades o accidentes.",
                    "Verbalización de incapacidad para afrontar o pedir ayuda.",
                    "Riesgo de daño a sí mismo o a otros.",
                    "Tensión muscular, cefaleas tensionales."
                    ],
                    "resultadosEsperados": [
                    "El paciente identificará patrones de afrontamiento ineficaces. (NOC 1302 Afrontamiento de problemas)",
                    "El paciente identificará y utilizará estrategias de afrontamiento efectivas. (NOC 1302)",
                    "El paciente verbalizará una sensación de mayor control sobre la situación.",
                    "El paciente utilizará el apoyo social disponible.",
                    "El paciente participará en la toma de decisiones sobre su cuidado."
                    ],
                    "intervenciones": [
                    "Aumentar el Afrontamiento (NIC 5230): Ayudar al paciente a evaluar la situación objetivamente. Identificar fortalezas y recursos personales. Fomentar la identificación y uso de estrategias de afrontamiento adaptativas.",
                    "Apoyo en la Toma de Decisiones (NIC 5250): Ayudar al paciente a clarificar valores y metas. Proporcionar información objetiva. Apoyar la decisión tomada.",
                    "Apoyo Emocional (NIC 5270): Facilitar la expresión de sentimientos. Escuchar activamente. Mostrar empatía.",
                    "Mejora de la Autoestima (NIC 5400): Ayudar a identificar aspectos positivos de sí mismo. Reforzar logros.",
                    "Movilización de la Red Social (NIC 7140): Identificar y fomentar el uso de sistemas de apoyo (familia, amigos, grupos).",
                    "Técnicas de Relajación (NIC 5880): Enseñar técnicas para reducir el estrés.",
                    "Modificación de la Conducta: Habilidades Sociales (NIC 4362): Si aplica, ayudar a mejorar habilidades de comunicación y asertividad.",
                    "Derivación: Considerar derivación a servicios de salud mental si es necesario."
                    ]
                },
                {
                    "id": "00276",
                    "label": "Autogestión ineficaz de la salud",
                    "definicion": "Patrón de regulación e integración en la vida diaria de un régimen terapéutico para el tratamiento de la enfermedad y sus secuelas que es insatisfactorio para alcanzar los objetivos de salud específicos.",
                    "relacionadoCon": [
                    "Complejidad del régimen terapéutico.",
                    "Complejidad del sistema de cuidados de salud.",
                    "Conflicto de decisiones.",
                    "Conflicto familiar.",
                    "Coste del régimen terapéutico.",
                    "Demandas excesivas (personales, familiares).",
                    "Fatiga.",
                    "Conocimientos deficientes sobre el régimen terapéutico.",
                    "Dificultades económicas.",
                    "Falta de apoyo social.",
                    "Impotencia.",
                    "Deterioro de la memoria.",
                    "Desconfianza en el régimen o en el personal de salud."
                    ],
                    "manifestadoPor": [
                    "Fracaso al incluir el régimen de tratamiento en la vida diaria.",
                    "Fracaso al emprender acciones para reducir los factores de riesgo.",
                    "Verbalización de dificultad con el tratamiento prescrito.",
                    "Verbalización de no haber emprendido acciones para incluir el tratamiento en la vida diaria.",
                    "Verbalización de no haber emprendido acciones para reducir los factores de riesgo.",
                    "Presencia de síntomas/complicaciones de la enfermedad exacerbados.",
                    "Falta de asistencia a citas de seguimiento.",
                    "Errores en la toma de medicación o seguimiento de la dieta/actividad."
                    ],
                    "resultadosEsperados": [
                    "El paciente participará activamente en el manejo de su régimen terapéutico. (NOC 1601 Conducta de cumplimiento)",
                    "El paciente verbalizará comprensión del régimen terapéutico y su importancia. (NOC 1813 Conocimiento: régimen terapéutico)",
                    "El paciente identificará y superará barreras para la autogestión. (NOC 1300 Aceptación: estado de salud)",
                    "El paciente demostrará conductas que integran el régimen en su vida diaria.",
                    "El paciente alcanzará los objetivos de salud establecidos (control de glucemia, PA, etc.)."
                    ],
                    "intervenciones": [
                    "Autogestión de la Enfermedad Crónica (NIC 4480): Ayudar al paciente a establecer metas realistas y alcanzables. Fomentar la autoeficacia.",
                    "Enseñanza: Régimen Terapéutico (NIC 5616): Asegurar que el paciente/familia comprenda el régimen (medicación, dieta, ejercicio, seguimiento). Simplificar el régimen si es posible.",
                    "Facilitar la Autorresponsabilidad (NIC 4480): Fomentar la participación activa del paciente en la toma de decisiones y el autocontrol.",
                    "Apoyo Social (NIC 5440): Identificar y movilizar recursos de apoyo social (familia, grupos).",
                    "Asesoramiento (NIC 5240): Ayudar a explorar y resolver barreras (creencias, actitudes, dificultades prácticas).",
                    "Establecimiento de Metas Comunes (NIC 4410): Colaborar con el paciente para definir metas significativas y planificar acciones.",
                    "Manejo de la Medicación (NIC 2380): Ayudar a organizar la medicación (pastilleros, alarmas). Revisar posibles efectos adversos.",
                    "Seguimiento Telefónico/Visitas Domiciliarias (NIC 8190 / 5000): Proporcionar apoyo y seguimiento continuado."
                    ]
                },
                {
                    "id": "00179",
                    "label": "Riesgo de nivel de glucemia inestable",
                    "definicion": "Susceptible a la variación de los niveles de glucosa en sangre fuera de los rangos normales, que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Monitorización inadecuada de la glucemia.",
                    "Manejo inadecuado de la medicación (insulina, hipoglucemiantes orales).",
                    "Aporte dietético inadecuado o inconsistente.",
                    "Nivel de actividad física inconsistente.",
                    "Conocimientos deficientes sobre el manejo de la diabetes.",
                    "Período de crecimiento rápido (adolescencia).",
                    "Embarazo.",
                    "Estrés, enfermedad aguda.",
                    "Aumento o pérdida de peso.",
                    "Estado mental alterado."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente mantendrá niveles de glucemia dentro del rango objetivo establecido. (NOC 2300 Nivel de glucemia)",
                    "El paciente demostrará conocimientos adecuados sobre el manejo de la diabetes (dieta, ejercicio, medicación, monitorización, manejo de hipo/hiperglucemia). (NOC 1820 Conocimiento: control de la diabetes)",
                    "El paciente realizará automonitorización de la glucemia según pauta.",
                    "El paciente ajustará su dieta, ejercicio y medicación según los niveles de glucemia y recomendaciones.",
                    "El paciente permanecerá libre de episodios de hipoglucemia e hiperglucemia severa."
                    ],
                    "intervenciones": [
                    "Manejo de la Hiperglucemia (NIC 2120) / Manejo de la Hipoglucemia (NIC 2130): Monitorizar niveles de glucemia. Vigilar signos/síntomas de hiper/hipoglucemia. Administrar insulina/carbohidratos según protocolo/prescripción.",
                    "Enseñanza: Manejo de la Diabetes (NIC 5602 / 5616): Educar sobre la enfermedad, dieta, ejercicio, medicación, automonitorización, reconocimiento y tratamiento de hipo/hiperglucemia, cuidado de los pies.",
                    "Fomento del Autocuidado (NIC 4480): Ayudar al paciente a asumir la responsabilidad del manejo diario de su diabetes.",
                    "Asesoramiento Nutricional (NIC 5246): Colaborar con dietista para establecer plan de alimentación individualizado.",
                    "Fomento del Ejercicio (NIC 0200): Educar sobre el impacto del ejercicio en la glucemia y cómo ajustar.",
                    "Manejo de la Medicación (NIC 2380): Asegurar correcta administración de insulina/hipoglucemiantes.",
                    "Identificación de Riesgos (NIC 6610): Evaluar factores que pueden desestabilizar la glucemia (enfermedad, estrés).",
                    "Establecimiento de Metas Comunes (NIC 4410): Acordar objetivos glucémicos y plan de acción con el paciente."
                    ]
                },
                {
                    "id": "00128",
                    "label": "Confusión aguda",
                    "definicion": "Inicio brusco de alteraciones reversibles de la conciencia, atención, conocimiento y percepción que se desarrollan en un corto período de tiempo.",
                    "relacionadoCon": [
                    "Edad >60 años.",
                    "Demencia subyacente.",
                    "Abuso de alcohol o drogas.",
                    "Polifarmacia.",
                    "Infección (urinaria, respiratoria, sepsis).",
                    "Deshidratación, desequilibrio electrolítico.",
                    "Hipoxia.",
                    "Dolor no controlado.",
                    "Impactación fecal, retención urinaria.",
                    "Privación de sueño.",
                    "Cambio de entorno (hospitalización, UCI).",
                    "Restricciones físicas.",
                    "Cirugía, anestesia.",
                    "Abstinencia de sustancias."
                    ],
                    "manifestadoPor": [
                    "Fluctuaciones en el nivel de conciencia y atención.",
                    "Desorientación (tiempo, lugar, persona).",
                    "Alteración de la memoria (especialmente reciente).",
                    "Alteraciones perceptivas (alucinaciones visuales/auditivas, ilusiones).",
                    "Pensamiento desorganizado, discurso incoherente.",
                    "Actividad psicomotora alterada (agitación, inquietud o letargia, enlentecimiento).",
                    "Ciclo sueño-vigilia alterado (somnolencia diurna, insomnio nocturno).",
                    "Labilidad emocional (irritabilidad, ansiedad, miedo, apatía)."
                    ],
                    "resultadosEsperados": [
                    "El paciente recuperará su nivel basal de función cognitiva y orientación. (NOC 0901 Orientación cognitiva)",
                    "El paciente mantendrá la seguridad personal. (NOC 1909 Conducta de prevención de caídas)",
                    "El paciente reconocerá a las personas familiares y el entorno.",
                    "El paciente estará libre de alucinaciones o interpretaciones erróneas del entorno.",
                    "Se identificarán y tratarán las causas subyacentes de la confusión."
                    ],
                    "intervenciones": [
                    "Manejo del Delirio (NIC 6440): Identificar y tratar causas subyacentes. Evaluar estado cognitivo regularmente (usar CAM - Confusion Assessment Method).",
                    "Orientación de la Realidad (NIC 4820): Reorientar frecuentemente sobre tiempo, lugar y persona. Usar calendarios, relojes, fotos familiares.",
                    "Manejo Ambiental: Seguridad (NIC 6486): Crear un entorno tranquilo, bien iluminado (luz nocturna tenue). Reducir estímulos excesivos. Asegurar que objetos familiares estén a la vista.",
                    "Vigilancia: Seguridad (NIC 6654): Prevenir caídas y lesiones. Evitar restricciones físicas si es posible.",
                    "Manejo de la Privación de Sueño (NIC 1850): Promover sueño nocturno (reducir ruido/luz, agrupar cuidados). Fomentar actividad diurna.",
                    "Comunicación: Déficit Sensorial (NIC 4976): Asegurar uso de gafas/audífonos si los necesita.",
                    "Fomento de la Implicación Familiar (NIC 7110): Animar a la familia a visitar y participar en la reorientación.",
                    "Manejo de la Medicación (NIC 2380): Revisar medicación, evitar fármacos de riesgo (sedantes, anticolinérgicos). Administrar medicación para síntomas (ej. haloperidol) con precaución si es necesario y está prescrito."
                    ]
                },
                {
                    "id": "00129",
                    "label": "Confusión crónica",
                    "definicion": "Deterioro irreversible, de larga duración y/o progresivo de la inteligencia y la personalidad, caracterizado por disminución de la capacidad para interpretar estímulos ambientales y disminución de la capacidad para los procesos intelectuales (pensamiento, juicio, orientación), que se manifiesta con alteraciones de la memoria, la orientación y la conducta.",
                    "relacionadoCon": [
                    "Enfermedad de Alzheimer.",
                    "Demencia multiinfarto.",
                    "Demencia por cuerpos de Lewy.",
                    "Demencia frontotemporal.",
                    "Enfermedad de Parkinson.",
                    "Enfermedad de Huntington.",
                    "Lesión cerebral traumática.",
                    "Infección por VIH.",
                    "Síndrome de Korsakoff (relacionado con alcoholismo crónico).",
                    "Edad avanzada (como factor de riesgo para demencias)."
                    ],
                    "manifestadoPor": [
                    "Pérdida de memoria progresiva (inicialmente reciente, luego remota).",
                    "Desorientación en tiempo, lugar y/o persona.",
                    "Alteración del juicio y la capacidad para tomar decisiones.",
                    "Alteración del pensamiento abstracto.",
                    "Cambios en la personalidad y el humor (apatía, irritabilidad, ansiedad, depresión, agitación).",
                    "Dificultad para realizar tareas familiares (deterioro funcional).",
                    "Lenguaje alterado (afasia).",
                    "Dificultad para reconocer objetos o personas (agnosia).",
                    "Dificultad para realizar movimientos intencionados (apraxia).",
                    "Comportamiento social inapropiado.",
                    "Vagabundeo."
                    ],
                    "resultadosEsperados": [
                    "El paciente mantendrá un nivel óptimo de funcionamiento cognitivo y físico dentro de las limitaciones de la enfermedad. (NOC 0900 Cognición)",
                    "El paciente mantendrá la seguridad física. (NOC 1909 Conducta de prevención de caídas)",
                    "El paciente participará en actividades significativas según su capacidad.",
                    "Las necesidades básicas del paciente (nutrición, hidratación, higiene, eliminación) serán satisfechas.",
                    "La familia/cuidador demostrará estrategias efectivas para manejar la confusión y los comportamientos asociados."
                    ],
                    "intervenciones": [
                    "Manejo de la Demencia (NIC 6460): Proporcionar un entorno seguro, estable y familiar. Establecer rutinas consistentes.",
                    "Estimulación Cognitiva (NIC 4720): Utilizar terapia de reminiscencia, orientación a la realidad (con precaución en fases avanzadas), actividades significativas.",
                    "Manejo Ambiental: Seguridad (NIC 6486): Prevenir caídas, quemaduras, intoxicaciones. Asegurar puertas/ventanas si hay riesgo de vagabundeo.",
                    "Comunicación: Mejorar la comunicación (NIC 4976): Usar frases cortas y sencillas. Hablar claro y despacio. Usar comunicación no verbal (gestos, contacto visual). Validar sentimientos.",
                    "Manejo de la Conducta (NIC 4350): Identificar desencadenantes de agitación o comportamientos difíciles. Usar distracción, reorientación suave. Evitar confrontaciones.",
                    "Ayuda con los Autocuidados (NIC 1800): Asistir en AVD según necesidad, fomentando la máxima independencia posible.",
                    "Apoyo al Cuidador Principal (NIC 7040): Proporcionar información, apoyo emocional, recursos y estrategias de manejo. Fomentar el respiro del cuidador.",
                    "Manejo de la Nutrición/Hidratación (NIC 1100 / 4120): Supervisar ingesta, ofrecer alimentos fáciles de manejar, adaptar consistencias si hay disfagia."
                    ]
                },
                {
                    "id": "00092",
                    "label": "Intolerancia a la actividad",
                    "definicion": "Disminución de la capacidad fisiológica o psicológica para tolerar o completar las actividades diarias requeridas o deseadas.",
                    "relacionadoCon": [
                    "Desequilibrio entre aporte y demanda de oxígeno (insuficiencia cardíaca, EPOC, anemia, enfermedad respiratoria).",
                    "Reposo en cama o inmovilidad prolongada.",
                    "Debilidad generalizada.",
                    "Sedentarismo.",
                    "Dolor.",
                    "Malnutrición.",
                    "Trastornos del sueño.",
                    "Estado de ánimo depresivo."
                    ],
                    "manifestadoPor": [
                    "Informe verbal de fatiga o debilidad.",
                    "Respuesta anormal de la frecuencia cardíaca o presión arterial a la actividad (aumento/descenso exagerado o falta de aumento).",
                    "Cambios electrocardiográficos que indican isquemia o arritmias durante/después de la actividad.",
                    "Malestar o disnea de esfuerzo.",
                    "Color de piel pálido o cianótico durante/después de la actividad.",
                    "Mareo o vértigo durante/después de la actividad."
                    ],
                    "resultadosEsperados": [
                    "El paciente demostrará tolerancia a la actividad deseada/requerida (constantes vitales estables, ausencia de disnea/dolor). (NOC 0005 Tolerancia a la actividad)",
                    "El paciente conservará la energía para realizar las actividades prioritarias. (NOC 0002 Conservación de la energía)",
                    "El paciente participará en actividades de autocuidado según su capacidad.",
                    "El paciente identificará factores que aumentan/disminuyen la tolerancia a la actividad.",
                    "El paciente utilizará técnicas de conservación de energía."
                    ],
                    "intervenciones": [
                    "Manejo de la Energía (NIC 0180): Determinar causas de la intolerancia. Equilibrar actividad y reposo. Planificar actividades durante períodos de máxima energía. Evitar actividades inmediatamente después de comer.",
                    "Terapia de Ejercicios: Ambulación/Movilidad Articular (NIC 0221 / 0224): Fomentar un aumento gradual de la actividad física según tolerancia. Monitorizar respuesta fisiológica (FC, PA, SpO2, disnea).",
                    "Ayuda con los Autocuidados (NIC 1800): Asistir en AVD si es necesario, permitiendo al paciente hacer lo que pueda.",
                    "Enseñanza: Actividad/Ejercicio Prescrito (NIC 5612): Educar sobre signos de intolerancia y cuándo detener la actividad.",
                    "Enseñanza: Técnicas de Conservación de Energía: Planificar tareas, simplificar el trabajo, sentarse en lugar de estar de pie, organizar el entorno para minimizar esfuerzo.",
                    "Manejo del Dolor/Nutrición/Sueño: Optimizar el control del dolor, estado nutricional y patrón de sueño, ya que influyen en la tolerancia a la actividad.",
                    "Oxigenoterapia (NIC 3320): Administrar oxígeno suplementario durante la actividad si está prescrito."
                    ]
                },
                {
                    "id": "00093",
                    "label": "Fatiga",
                    "definicion": "Sensación sostenida y abrumadora de agotamiento y disminución de la capacidad para el trabajo físico y mental a nivel habitual.",
                    "relacionadoCon": [
                    "Fisiológicos: Enfermedad aguda o crónica (cáncer, anemia, infección, hipotiroidismo, insuficiencia cardíaca/renal), embarazo, mala condición física, privación de sueño, malnutrición, dolor crónico.",
                    "Psicológicos: Estrés, ansiedad, depresión, acontecimientos vitales negativos.",
                    "Tratamiento: Efectos secundarios de medicación (quimioterapia, radioterapia, beta-bloqueantes), cirugía.",
                    "Situacionales: Sobrecarga laboral/familiar, exigencias excesivas."
                    ],
                    "manifestadoPor": [
                    "Informe verbal de falta de energía constante o abrumadora.",
                    "Incapacidad para mantener las rutinas habituales.",
                    "Aumento de las quejas físicas.",
                    "Disminución del rendimiento.",
                    "Somnolencia, letargia.",
                    "Falta de interés en el entorno, apatía.",
                    "Introspección.",
                    "Dificultad para concentrarse.",
                    "Sensación de necesidad de descanso adicional."
                    ],
                    "resultadosEsperados": [
                    "El paciente identificará factores que contribuyen a la fatiga. (NOC 0007 Nivel de fatiga)",
                    "El paciente utilizará estrategias de conservación de energía. (NOC 0002 Conservación de la energía)",
                    "El paciente equilibrará actividad y descanso.",
                    "El paciente mantendrá una nutrición e hidratación adecuadas.",
                    "El paciente verbalizará un aumento en el nivel de energía o una mejor capacidad para manejar la fatiga.",
                    "El paciente participará en actividades deseadas según su nivel de energía."
                    ],
                    "intervenciones": [
                    "Manejo de la Energía (NIC 0180): Evaluar nivel y factores contribuyentes a la fatiga (usar escala). Ayudar a priorizar actividades. Fomentar períodos de descanso programados.",
                    "Manejo de la Nutrición (NIC 1100): Asegurar ingesta adecuada de calorías, proteínas y nutrientes (hierro, vitaminas).",
                    "Manejo del Sueño (NIC 1850): Promover higiene del sueño para mejorar descanso nocturno.",
                    "Fomento del Ejercicio (NIC 0200): Animar a realizar ejercicio físico suave y regular (caminar), ya que puede reducir la fatiga a largo plazo (adaptado a la condición del paciente).",
                    "Ayuda con los Autocuidados (NIC 1800): Asistir si la fatiga interfiere con las AVD.",
                    "Apoyo Emocional (NIC 5270): Validar la experiencia de la fatiga. Ayudar a manejar el estrés o la ansiedad asociados.",
                    "Enseñanza: Técnicas de Conservación de Energía.",
                    "Manejo del Dolor (NIC 1400): Controlar el dolor crónico que contribuye a la fatiga."
                    ]
                },
                {
                    "id": "00198",
                    "label": "Trastorno del patrón del sueño",
                    "definicion": "Interrupciones durante el tiempo de sueño/vigilia que causan malestar o interfieren en el estilo de vida deseado.",
                    "relacionadoCon": [
                    "Factores ambientales: Ruido, luz, interrupciones (hospitalización), temperatura inadecuada, falta de privacidad.",
                    "Factores fisiológicos: Dolor, disnea, nicturia, tos, fiebre, náuseas, apnea del sueño, síndrome de piernas inquietas, cambios hormonales (menopausia).",
                    "Factores psicológicos: Ansiedad, estrés, depresión, duelo, miedo.",
                    "Factores farmacológicos: Estimulantes (cafeína, descongestionantes), alcohol, beta-bloqueantes, diuréticos, corticoides, abstinencia de hipnóticos/sedantes.",
                    "Patrones de actividad/descanso: Cambios de turno laboral, viajes (jet lag), siestas diurnas prolongadas, inactividad física.",
                    "Higiene del sueño inadecuada."
                    ],
                    "manifestadoPor": [
                    "Informe verbal de dificultad para conciliar el sueño, despertares frecuentes o despertar precoz.",
                    "Informe verbal de no sentirse descansado.",
                    "Observación de somnolencia diurna, bostezos frecuentes.",
                    "Cambios en el estado de ánimo (irritabilidad, apatía, ansiedad).",
                    "Disminución del rendimiento, dificultad para concentrarse.",
                    "Círculos oscuros bajo los ojos.",
                    "Inquietud, agitación nocturna.",
                    "Cambios en el comportamiento (confusión leve)."
                    ],
                    "resultadosEsperados": [
                    "El paciente alcanzará y mantendrá un patrón de sueño reparador. (NOC 0004 Sueño)",
                    "El paciente identificará factores que interfieren con el sueño.",
                    "El paciente implementará medidas de higiene del sueño.",
                    "El paciente verbalizará sentirse más descansado al despertar.",
                    "El paciente mostrará mejora en el estado de ánimo y nivel de energía diurno."
                    ],
                    "intervenciones": [
                    "Mejorar el Sueño (NIC 1850): Evaluar patrón de sueño habitual y actual (diario de sueño). Identificar factores contribuyentes.",
                    "Manejo Ambiental: Confort (NIC 6482): Controlar ruido, luz y temperatura de la habitación. Agrupar cuidados nocturnos para minimizar interrupciones.",
                    "Fomento de la Higiene del Sueño: Enseñar rutinas relajantes antes de dormir (baño tibio, lectura). Establecer horarios regulares de acostarse/levantarse. Evitar cafeína/alcohol/nicotina cerca de la hora de dormir. Evitar comidas pesadas o ejercicio intenso antes de acostarse. Limitar siestas diurnas.",
                    "Técnicas de Relajación (NIC 5880): Enseñar relajación muscular progresiva, respiración profunda, meditación.",
                    "Manejo del Dolor (NIC 1400): Asegurar control adecuado del dolor, especialmente por la noche.",
                    "Manejo de la Medicación (NIC 2380): Administrar hipnóticos/sedantes según prescripción (uso a corto plazo preferiblemente). Evaluar efectos de otros medicamentos sobre el sueño.",
                    "Fomento del Ejercicio (NIC 0200): Animar a realizar ejercicio regular durante el día.",
                    "Manejo de la Ansiedad/Estrés (NIC 5820): Ayudar a manejar preocupaciones que interfieran con el sueño."
                    ]
                },
                {
                    "id": "00102",
                    "label": "Déficit de autocuidado: alimentación",
                    "definicion": "Deterioro de la capacidad para realizar las actividades de comer.",
                    "relacionadoCon": [
                    "Deterioro cognitivo (demencia, confusión).",
                    "Deterioro neuromuscular o musculoesquelético (debilidad, temblor, falta de coordinación, contracturas, parálisis, falta de una extremidad).",
                    "Dolor.",
                    "Fatiga, disminución de la tolerancia a la actividad.",
                    "Deterioro visual.",
                    "Barreras ambientales.",
                    "Ansiedad severa, depresión.",
                    "Falta de motivación."
                    ],
                    "manifestadoPor": [
                    "Incapacidad para llevar los alimentos del recipiente a la boca.",
                    "Incapacidad para preparar los alimentos para la ingestión (cortar, abrir envases).",
                    "Incapacidad para manejar utensilios (cubiertos, taza).",
                    "Incapacidad para masticar o deglutir alimentos (puede solaparse con Deterioro de la deglución).",
                    "Ingesta insuficiente.",
                    "Derramar comida."
                    ],
                    "resultadosEsperados": [
                    "El paciente realizará las actividades de alimentación de forma independiente o con la mínima ayuda necesaria/dispositivos de adaptación. (NOC 0303 Autocuidados: comer)",
                    "El paciente mantendrá un estado nutricional adecuado. (NOC 1004 Estado nutricional)",
                    "El paciente expresará satisfacción con su capacidad para comer."
                    ],
                    "intervenciones": [
                    "Ayuda con los Autocuidados: Alimentación (NIC 1803): Colocar al paciente en posición cómoda y adecuada para comer. Abrir envases, cortar alimentos, proporcionar utensilios adaptados (mangos engrosados, platos con reborde).",
                    "Alimentación (NIC 1050): Proporcionar asistencia física para llevar los alimentos a la boca si es necesario. Dar tiempo suficiente.",
                    "Monitorización Nutricional (NIC 1160): Vigilar la ingesta real de alimentos y líquidos.",
                    "Terapia de Deglución (NIC 1860): Si hay problemas de deglución asociados.",
                    "Manejo Ambiental: Confort (NIC 6482): Crear un ambiente agradable y sin prisas para comer.",
                    "Fomento de la Autoestima/Autocuidado: Animar al paciente a hacer lo máximo posible por sí mismo.",
                    "Enseñanza: Habilidades de Autocuidado: Instruir sobre el uso de dispositivos de adaptación.",
                    "Derivación: Considerar terapia ocupacional para evaluar y entrenar en el uso de adaptaciones."
                    ]
                },
                {
                    "id": "00108",
                    "label": "Déficit de autocuidado: baño",
                    "definicion": "Deterioro de la capacidad de la persona para realizar o completar por sí misma las actividades de baño/higiene.",
                    "relacionadoCon": [
                    "Deterioro cognitivo.",
                    "Deterioro neuromuscular o musculoesquelético (limitación del rango de movimiento, disminución de la fuerza/resistencia, falta de coordinación).",
                    "Dolor.",
                    "Fatiga.",
                    "Deterioro visual.",
                    "Barreras ambientales (baño inaccesible, falta de ayudas técnicas).",
                    "Ansiedad severa, depresión.",
                    "Alteración de la percepción."
                    ],
                    "manifestadoPor": [
                    "Incapacidad para lavar el cuerpo total o parcialmente.",
                    "Incapacidad para obtener o acceder a los artículos de baño.",
                    "Incapacidad para secar el cuerpo.",
                    "Incapacidad para regular la temperatura o el flujo del agua.",
                    "Incapacidad para entrar o salir del baño/ducha.",
                    "Mal olor corporal, piel sucia."
                    ],
                    "resultadosEsperados": [
                    "El paciente realizará las actividades de baño/higiene de forma independiente o con la mínima ayuda necesaria/dispositivos de adaptación. (NOC 0301 Autocuidados: baño)",
                    "El paciente mantendrá la piel limpia y sin olor corporal.",
                    "El paciente expresará satisfacción con su nivel de higiene.",
                    "El paciente permanecerá libre de lesiones durante el baño."
                    ],
                    "intervenciones": [
                    "Ayuda con los Autocuidados: Baño/Higiene (NIC 1801): Proporcionar asistencia según necesidad (lavar espalda, pies, ayuda para entrar/salir de la ducha/bañera). Fomentar la independencia en lo posible.",
                    "Baño (NIC 1610): Realizar el baño completo en cama o asistir en ducha/bañera.",
                    "Manejo Ambiental: Seguridad (NIC 6486): Asegurar que el baño sea seguro (alfombrillas antideslizantes, barras de apoyo, silla de ducha/bañera).",
                    "Vigilancia de la Piel (NIC 3590): Inspeccionar la piel durante el baño.",
                    "Fomento de la Autoestima/Autocuidado: Elogiar los esfuerzos del paciente.",
                    "Enseñanza: Habilidades de Autocuidado: Instruir sobre el uso de ayudas técnicas (esponjas de mango largo, asientos de baño).",
                    "Manejo de la Energía (NIC 0180): Programar el baño en momentos de mayor energía si hay fatiga."
                    ]
                },
                {
                    "id": "00109",
                    "label": "Déficit de autocuidado: vestido",
                    "definicion": "Deterioro de la capacidad de la persona para realizar o completar por sí misma las actividades de vestido y arreglo personal.",
                    "relacionadoCon": [
                    "Deterioro cognitivo.",
                    "Deterioro neuromuscular o musculoesquelético (limitación de movilidad, falta de coordinación, debilidad).",
                    "Dolor.",
                    "Fatiga.",
                    "Deterioro visual.",
                    "Barreras ambientales (ropa inadecuada, falta de espacio).",
                    "Ansiedad, depresión, apatía.",
                    "Alteración de la percepción."
                    ],
                    "manifestadoPor": [
                    "Incapacidad para ponerse o quitarse las prendas de vestir necesarias.",
                    "Incapacidad para elegir ropa apropiada.",
                    "Incapacidad para usar cierres (botones, cremalleras, cordones).",
                    "Incapacidad para obtener o reemplazar prendas de vestir.",
                    "Aspecto desaliñado, ropa inapropiada para el clima o la situación.",
                    "Vestido sucio o manchado."
                    ],
                    "resultadosEsperados": [
                    "El paciente se vestirá y arreglará de forma independiente o con la mínima ayuda necesaria/dispositivos de adaptación. (NOC 0302 Autocuidados: vestir)",
                    "El paciente seleccionará ropa apropiada para el clima y la ocasión.",
                    "El paciente mantendrá un aspecto aseado.",
                    "El paciente expresará satisfacción con su capacidad para vestirse."
                    ],
                    "intervenciones": [
                    "Ayuda con los Autocuidados: Vestir/Arreglo personal (NIC 1802): Proporcionar la ropa al alcance. Ayudar a ponerse/quitarse prendas según necesidad (empezar por el lado afectado). Utilizar ropa fácil de poner (tallas más grandes, cierres de velcro, cinturas elásticas).",
                    "Vestir (NIC 1630): Asistir completamente si es necesario.",
                    "Fomento de la Autoestima/Autocuidado: Dar tiempo suficiente, no apresurar. Permitir que el paciente elija su ropa si es posible.",
                    "Manejo Ambiental: Preparar la ropa en orden de colocación. Asegurar privacidad.",
                    "Enseñanza: Habilidades de Autocuidado: Instruir sobre técnicas de vestido con una sola mano o uso de ayudas (calzador de mango largo, abotonador).",
                    "Derivación: Considerar terapia ocupacional para entrenamiento y adaptaciones."
                    ]
                },
                {
                    "id": "00110",
                    "label": "Déficit de autocuidado: uso del inodoro",
                    "definicion": "Deterioro de la capacidad de la persona para realizar o completar por sí misma las actividades de eliminación en el inodoro.",
                    "relacionadoCon": [
                    "Deterioro de la movilidad física (incapacidad para llegar al baño, sentarse/levantarse del inodoro).",
                    "Deterioro neuromuscular o musculoesquelético (falta de fuerza, equilibrio).",
                    "Deterioro cognitivo (incapacidad para reconocer la necesidad o localizar el baño).",
                    "Fatiga, debilidad.",
                    "Dolor.",
                    "Barreras ambientales (inodoro bajo, falta de barras de apoyo, distancia al baño).",
                    "Deterioro visual.",
                    "Ansiedad severa."
                    ],
                    "manifestadoPor": [
                    "Incapacidad para llegar al inodoro o al orinal/cuña.",
                    "Incapacidad para sentarse o levantarse del inodoro.",
                    "Incapacidad para manipular la ropa para la eliminación.",
                    "Incapacidad para realizar la higiene perineal después de la eliminación.",
                    "Incapacidad para tirar de la cadena o vaciar el orinal/cuña.",
                    "Episodios de incontinencia funcional."
                    ],
                    "resultadosEsperados": [
                    "El paciente utilizará el inodoro de forma independiente o con la mínima ayuda necesaria/dispositivos de adaptación. (NOC 0310 Autocuidados: uso del inodoro)",
                    "El paciente llegará al baño a tiempo para evitar accidentes.",
                    "El paciente realizará la higiene adecuada después de la eliminación.",
                    "El paciente mantendrá la continencia (si no hay otra causa de incontinencia)."
                    ],
                    "intervenciones": [
                    "Ayuda con los Autocuidados: Uso del Inodoro (NIC 1804): Acompañar al baño. Ayudar a bajar/subir la ropa. Asistir para sentarse/levantarse. Proporcionar artículos para la higiene.",
                    "Manejo Ambiental: Seguridad/Accesibilidad (NIC 6486): Asegurar camino despejado al baño. Instalar barras de apoyo, asiento de inodoro elevado. Proporcionar silla-inodoro junto a la cama si es necesario.",
                    "Entrenamiento del Hábito Urinario/Intestinal (NIC 0470 / 0600): Ofrecer ir al baño a intervalos regulares o según patrón previo.",
                    "Ayuda con los Autocuidados: Transferencia (NIC 1806): Enseñar y asistir en transferencias seguras.",
                    "Prevención de Caídas (NIC 6490): Implementar medidas de seguridad durante los traslados al baño.",
                    "Vigilancia (NIC 6650): Estar atento a señales de necesidad de eliminación.",
                    "Fomento de la Autonomía: Animar la independencia en lo posible."
                    ]
                },
                {
                    "id": "00134",
                    "label": "Náuseas",
                    "definicion": "Sensación subjetiva desagradable, como oleadas, en la parte posterior de la garganta, epigastrio o abdomen que puede o no conducir al vómito.",
                    "relacionadoCon": [
                    "Tratamientos médicos: Quimioterapia, radioterapia, anestesia, cirugía (especialmente abdominal), medicación (opiáceos, antibióticos, AINEs).",
                    "Factores bioquímicos: Uremia, cetoacidosis diabética, toxinas.",
                    "Factores biofísicos: Dolor intenso, mareo por movimiento, embarazo, tumores (gástricos, cerebrales), distensión gástrica, irritación gastrointestinal (gastroenteritis, úlcera péptica), estreñimiento.",
                    "Factores situacionales: Olores/sabores desagradables, estimulación visual desagradable, factores psicológicos (ansiedad, miedo, estrés)."
                    ],
                    "manifestadoPor": [
                    "Informe verbal de náuseas o ganas de vomitar",
                    "Aversión a la comida.",
                    "Sensación de vómito inminente.",
                    "Aumento de la salivación.",
                    "Palidez.",
                    "Diaforesis fría.",
                    "Taquicardia.",
                    "Aumento de la deglución.",
                    "Sabor agrio en la boca."
                    ],
                    "resultadosEsperados": [
                    "El paciente referirá ausencia o disminución de las náuseas. (NOC 2107 Nivel de náuseas y vómitos)",
                    "El paciente mantendrá una ingesta adecuada de líquidos y nutrientes. (NOC 1008 Estado nutricional: ingestión alimentaria y de líquidos)",
                    "El paciente identificará y evitará factores desencadenantes.",
                    "El paciente utilizará medidas farmacológicas y no farmacológicas para controlar las náuseas."
                    ],
                    "intervenciones": [
                    "Manejo de las Náuseas (NIC 1450): Evaluar causa, intensidad, frecuencia y factores desencadenantes. Animar al paciente a describir la sensación.",
                    "Administración de Medicación: Antieméticos (NIC 2300 / 2313 / 2314): Administrar antieméticos prescritos antes de tratamientos desencadenantes (quimio) o al inicio de los síntomas. Evaluar eficacia.",
                    "Manejo Ambiental: Confort (NIC 6482): Reducir estímulos desagradables (olores, vistas). Mantener ambiente fresco y ventilado.",
                    "Manejo de Líquidos/Nutrición (NIC 4120 / 1100): Ofrecer líquidos fríos, claros y carbonatados en pequeños sorbos. Fomentar comidas pequeñas, frecuentes, blandas y frías/a temperatura ambiente. Evitar alimentos grasos, fritos o muy condimentados.",
                    "Técnicas de Distracción/Relajación (NIC 5880 / 5900): Música suave, conversación, respiración profunda.",
                    "Acupresión: Aplicar presión en el punto P6 (Neiguan) en la muñeca.",
                    "Higiene Oral (NIC 1710): Realizar higiene oral frecuente para eliminar sabores desagradables.",
                    "Manejo del Dolor/Ansiedad: Controlar otros síntomas que puedan contribuir a las náuseas."
                    ]
                },
                {
                    "id": "00029",
                    "label": "Disminución del gasto cardíaco",
                    "definicion": "La cantidad de sangre bombeada por el corazón es inadecuada para satisfacer las demandas metabólicas del cuerpo.",
                    "relacionadoCon": [
                    "Alteración de la precarga (disminución del retorno venoso, hipervolemia).",
                    "Alteración de la poscarga (aumento de la resistencia vascular sistémica/pulmonar, hipertensión).",
                    "Alteración de la contractilidad (infarto de miocardio, miocardiopatía, insuficiencia cardíaca, efectos de fármacos).",
                    "Alteración de la frecuencia o ritmo cardíaco (taquicardia, bradicardia, arritmias)."
                    ],
                    "manifestadoPor": [
                    "Alteraciones de la frecuencia o ritmo cardíaco (taquicardia, bradicardia, arritmias, palpitaciones).",
                    "Alteraciones de la presión arterial (hipotensión, hipertensión).",
                    "Disminución de los pulsos periféricos.",
                    "Piel fría, pálida, húmeda.",
                    "Llenado capilar prolongado (>3 segundos).",
                    "Edema.",
                    "Disnea, ortopnea, crepitantes pulmonares.",
                    "Distensión venosa yugular.",
                    "Disminución de la diuresis (oliguria).",
                    "Fatiga, debilidad.",
                    "Alteración del estado mental (ansiedad, inquietud, confusión, letargia).",
                    "Aumento/disminución de la presión venosa central (PVC) o presión de enclavamiento pulmonar (PCP).",
                    "Disminución del índice cardíaco/gasto cardíaco."
                    ],
                    "resultadosEsperados": [
                    "El paciente mantendrá un gasto cardíaco adecuado para la perfusión tisular. (NOC 0400 Efectividad de la bomba cardíaca)",
                    "El paciente mostrará signos vitales y parámetros hemodinámicos dentro de límites normales/aceptables. (NOC 0401 Estado circulatorio)",
                    "El paciente mantendrá una perfusión tisular periférica adecuada (pulsos presentes, piel caliente, llenado capilar <3 seg). (NOC 0407 Perfusión tisular: periférica)",
                    "El paciente permanecerá libre de disnea o edema significativo.",
                    "El paciente mantendrá un estado mental orientado."
                    ],
                    "intervenciones": [
                    "Cuidados Cardíacos (NIC 4040): Monitorizar ritmo y frecuencia cardíaca, presión arterial, sonidos cardíacos. Vigilar signos de insuficiencia cardíaca.",
                    "Regulación Hemodinámica (NIC 4150): Monitorizar parámetros hemodinámicos (GC, IC, PVC, PCP, RVS). Administrar fármacos vasoactivos/inotrópicos según prescripción. Manejar fluidoterapia.",
                    "Monitorización de Signos Vitales (NIC 6680): Control frecuente de FC, FR, PA, temperatura, SpO2.",
                    "Manejo de Líquidos/Electrolitos (NIC 2080): Control estricto de ingesta y eliminación. Pesar diariamente. Ajustar aporte hídrico según estado.",
                    "Monitorización Respiratoria (NIC 3350): Evaluar sonidos pulmonares, patrón respiratorio, signos de edema pulmonar.",
                    "Manejo de Arritmias (NIC 4090): Identificar y tratar arritmias según protocolo/prescripción.",
                    "Reducción de la Ansiedad (NIC 5820): Proporcionar ambiente tranquilo, informar al paciente.",
                    "Manejo de la Energía (NIC 0180): Equilibrar actividad y reposo para reducir demanda cardíaca."
                    ]
                },
                {
                    "id": "00204",
                    "label": "Perfusión tisular periférica ineficaz",
                    "definicion": "Disminución de la circulación sanguínea periférica que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Conocimientos deficientes sobre factores agravantes (tabaquismo, sedentarismo, dieta alta en grasas).",
                    "Conocimientos deficientes sobre el proceso de la enfermedad (diabetes, hipertensión, hiperlipidemia, enfermedad vascular periférica).",
                    "Estilo de vida sedentario.",
                    "Tabaquismo.",
                    "Diabetes mellitus.",
                    "Hipertensión.",
                    "Hiperlipidemia."
                    ],
                    "manifestadoPor": [
                    "Ausencia o disminución de pulsos periféricos.",
                    "Alteración de las características de la piel (color pálido/cianótico, temperatura fría, piel fina/brillante, pérdida de vello).",
                    "Llenado capilar prolongado (>3 segundos).",
                    "Edema.",
                    "Claudicación intermitente (dolor en extremidades con el ejercicio).",
                    "Dolor en extremidades en reposo.",
                    "Parestesias (hormigueo, entumecimiento).",
                    "Retraso en la curación de heridas periféricas.",
                    "Índice tobillo-brazo (ITB) disminuido."
                    ],
                    "resultadosEsperados": [
                    "El paciente mantendrá una perfusión tisular periférica adecuada. (NOC 0407 Perfusión tisular: periférica)",
                    "El paciente mostrará pulsos periféricos palpables y simétricos.",
                    "El paciente tendrá piel de extremidades caliente, seca y de color normal.",
                    "El paciente referirá ausencia o disminución del dolor en extremidades (claudicación/reposo).",
                    "El paciente demostrará conocimientos sobre medidas para mejorar la circulación periférica."
                    ],
                    "intervenciones": [
                    "Cuidados Circulatorios: Insuficiencia Arterial (NIC 4062) / Insuficiencia Venosa (NIC 4066): Evaluar pulsos, color, temperatura, llenado capilar, sensibilidad y presencia de edema/dolor en extremidades. Medir ITB si aplica.",
                    "Monitorización de los Signos Vitales (NIC 6680).",
                    "Fomento del Ejercicio: Programa de paseo pautado para claudicación (si es arterial).",
                    "Cuidados de los Pies: Inspeccionar pies diariamente. Mantener limpios y secos. Usar calzado adecuado. Evitar lesiones.",
                    "Manejo del Dolor (NIC 1400).",
                    "Prevención de Úlceras por Presión (NIC 3540): Especial atención a talones y zonas con mala perfusión.",
                    "Enseñanza: Proceso de Enfermedad/Tratamiento (NIC 5602 / 5616): Educar sobre la enfermedad, factores de riesgo (dejar de fumar, control de diabetes/HTA/lípidos), cuidado de los pies, signos de empeoramiento.",
                    "Posicionamiento: Evitar cruzar piernas. Elevar piernas si es insuficiencia venosa (si no hay contraindicación arterial severa). Evitar prendas ajustadas."
                    ]
                },
                {
                    "id": "00051",
                    "label": "Deterioro de la comunicación verbal",
                    "definicion": "Disminución, retraso o ausencia de la capacidad para recibir, procesar, transmitir y/o usar un sistema de símbolos.",
                    "relacionadoCon": [
                    "Fisiológicos: Alteración del sistema nervioso central (ACV, tumor cerebral, traumatismo), alteración anatómica (paladar hendido, alteración neuromuscular de órganos del habla), presencia de traqueostomía/tubo endotraqueal, déficit auditivo.",
                    "Psicológicos: Barreras psicológicas (psicosis, falta de estímulo), estrés severo.",
                    "Situacionales: Barreras físicas (intubación), barreras culturales/idiomáticas, falta de información.",
                    "Del desarrollo: Retraso del desarrollo."
                    ],
                    "manifestadoPor": [
                    "Dificultad para formar palabras o frases (disartria, apraxia).",
                    "Dificultad para comprender el lenguaje (afasia receptiva).",
                    "Dificultad para expresar pensamientos verbalmente (afasia expresiva).",
                    "Dificultad para nombrar objetos (anomia).",
                    "Habla lenta, dificultosa o ausente.",
                    "Uso inapropiado de las palabras.",
                    "Incapacidad o dificultad para hablar.",
                    "Incapacidad o dificultad para entender.",
                    "Disnea.",
                    "Desorientación.",
                    "Verbalización inapropiada.",
                    "Frustración, retraimiento."
                    ],
                    "resultadosEsperados": [
                    "El paciente establecerá un método de comunicación funcional para expresar sus necesidades. (NOC 0902 Comunicación: expresiva / NOC 0903 Comunicación: receptiva)",
                    "El paciente utilizará dispositivos/técnicas de comunicación alternativa si es necesario.",
                    "El paciente mostrará disminución de la frustración relacionada con la comunicación.",
                    "Las necesidades básicas del paciente serán comprendidas y satisfechas.",
                    "La familia participará eficazmente en la comunicación con el paciente."
                    ],
                    "intervenciones": [
                    "Mejorar la Comunicación: Déficit del Habla (NIC 4976) / Déficit Auditivo (NIC 4976): Evaluar tipo y grado de déficit. Escuchar atentamente, dar tiempo para responder. Usar preguntas cerradas (sí/no) si hay dificultad expresiva.",
                    "Fomento de la Comunicación: Déficit del Habla (NIC 4976): Utilizar lenguaje sencillo y claro. Hablar despacio. Apoyar con gestos, escritura, dibujos, tableros de comunicación.",
                    "Escucha Activa (NIC 4920): Prestar atención a la comunicación verbal y no verbal.",
                    "Presencia (NIC 5340): Pasar tiempo con el paciente para facilitar la comunicación.",
                    "Manejo Ambiental: Reducir ruido ambiental. Asegurar buena iluminación para facilitar lectura labial/gestos.",
                    "Derivación: Consultar con logopeda/terapeuta del habla.",
                    "Fomento de la Implicación Familiar (NIC 7110): Enseñar a la familia técnicas de comunicación efectivas."
                    ]
                },
                {
                    "id": "00206",
                    "label": "Riesgo de sangrado",
                    "definicion": "Susceptible a una disminución del volumen de sangre que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Trastornos de la coagulación (hemofilia, enfermedad de von Willebrand, coagulación intravascular diseminada - CID).",
                    "Trombocitopenia.",
                    "Disfunción hepática (disminución de factores de coagulación).",
                    "Régimen terapéutico: Anticoagulantes (heparina, warfarina, nuevos anticoagulantes orales), antiagregantes plaquetarios (aspirina, clopidogrel), AINEs, quimioterapia.",
                    "Traumatismo.",
                    "Cirugía (especialmente extensa o en zonas vascularizadas).",
                    "Úlceras gastrointestinales.",
                    "Aneurismas.",
                    "Embarazo (complicaciones como placenta previa, desprendimiento).",
                    "Postparto (atonía uterina)."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente no experimentará sangrado activo o signos de hemorragia oculta. (NOC 0413 Severidad de la pérdida de sangre)",
                    "El paciente mantendrá parámetros de coagulación (TP, TTPa, INR, plaquetas) dentro de límites terapéuticos/normales.",
                    "El paciente mantendrá constantes vitales estables.",
                    "El paciente y la familia identificarán signos precoces de sangrado y sabrán cuándo buscar ayuda."
                    ],
                    "intervenciones": [
                    "Precauciones contra la Hemorragia (NIC 4010): Monitorizar signos vitales (hipotensión, taquicardia). Vigilar signos de sangrado externo (epistaxis, gingivorragia, hematuria, melenas, hematemesis, sangrado de heridas/punciones) y oculto (dolor abdominal, distensión, cefalea, cambios neurológicos).",
                    "Monitorización de Resultados de Laboratorio: Controlar Hgb, Hct, plaquetas, pruebas de coagulación (TP/INR, TTPa).",
                    "Protección contra Lesiones: Evitar procedimientos invasivos innecesarios (inyecciones IM, sondajes). Usar agujas de pequeño calibre. Aplicar presión prolongada en sitios de punción. Utilizar cepillo de dientes suave, maquinilla eléctrica.",
                    "Administración de Medicación (NIC 2300): Administrar hemoderivados (plaquetas, plasma, sangre) o fármacos procoagulantes (vitamina K, antifibrinolíticos) según prescripción.",
                    "Manejo de la Terapia Anticoagulante: Asegurar dosis correcta y monitorización adecuada si el paciente está anticoagulado.",
                    "Vigilancia (NIC 6650): Observación estrecha de pacientes con alto riesgo.",
                    "Enseñanza: Proceso de Enfermedad/Tratamiento (NIC 5602 / 5616): Educar al paciente/familia sobre precauciones, signos de sangrado y cuándo alertar al personal sanitario."
                    ]
                },
                {
                    "id": "00061",
                    "label": "Cansancio del rol de cuidador",
                    "definicion": "Dificultad para desempeñar el rol de cuidador familiar.",
                    "relacionadoCon": [
                    "Gravedad o cronicidad de la enfermedad del receptor de cuidados.",
                    "Aumento de las necesidades de cuidado con el tiempo.",
                    "Duración prolongada del cuidado.",
                    "Complejidad/cantidad de tareas de cuidado.",
                    "Falta de respiro o descanso para el cuidador.",
                    "Aislamiento social del cuidador.",
                    "Apoyo social inadecuado.",
                    "Recursos económicos insuficientes.",
                    "Problemas de salud propios del cuidador (físicos o psicológicos).",
                    "Relación conflictiva previa con el receptor de cuidados.",
                    "Inexperiencia o falta de conocimientos/habilidades para el cuidado.",
                    "Expectativas no realistas."
                    ],
                    "manifestadoPor": [
                    "Físicos: Fatiga, trastornos del sueño, cambios de peso, aumento de problemas de salud.",
                    "Emocionales: Depresión, ansiedad, irritabilidad, frustración, ira, sentimiento de culpa, desesperanza, labilidad emocional.",
                    "Sociales: Aislamiento social, abandono de actividades de ocio, conflictos familiares.",
                    "Relacionados con el cuidado: Preocupación por el receptor de cuidados, impaciencia, dificultad para completar tareas de cuidado, verbalización de sentirse sobrecargado o atrapado.",
                    "Cognitivos: Dificultad para concentrarse o tomar decisiones."
                    ],
                    "resultadosEsperados": [
                    "El cuidador identificará factores que contribuyen al cansancio. (NOC 2208 Bienestar del cuidador principal)",
                    "El cuidador utilizará estrategias de afrontamiento efectivas. (NOC 1302 Afrontamiento de problemas)",
                    "El cuidador utilizará recursos de apoyo disponibles (familia, amigos, servicios comunitarios). (NOC 2600 Facilitación de la implicación familiar)",
                    "El cuidador equilibrará las demandas del cuidado con sus propias necesidades (descanso, salud, ocio).",
                    "El cuidador expresará sentimientos de satisfacción o control en su rol."
                    ],
                    "intervenciones": [
                    "Apoyo al Cuidador Principal (NIC 7040): Establecer relación de confianza. Escuchar activamente preocupaciones y sentimientos. Validar dificultades.",
                    "Fomento de la Implicación Familiar (NIC 7110): Ayudar a identificar y movilizar apoyo de otros familiares/amigos.",
                    "Identificación de Recursos: Informar sobre recursos comunitarios (grupos de apoyo, servicios de respiro, ayuda a domicilio, centros de día).",
                    "Aumentar el Afrontamiento (NIC 5230): Ayudar a identificar estrategias de manejo del estrés. Fomentar autocuidado (descanso, ejercicio, tiempo personal).",
                    "Enseñanza: Habilidades de Cuidado: Proporcionar formación sobre tareas específicas de cuidado si es necesario.",
                    "Asesoramiento (NIC 5240): Ayudar a establecer límites realistas y a manejar sentimientos de culpa o resentimiento.",
                    "Manejo de la Energía (NIC 0180): Aplicado al cuidador, ayudar a planificar y priorizar tareas.",
                    "Facilitar el Respiro del Cuidador: Explorar opciones para que el cuidador tenga tiempo libre."
                    ]
                },
                {
                    "id": "00005",
                    "label": "Riesgo de desequilibrio de la temperatura corporal",
                    "definicion": "Susceptible a sufrir un fallo de los mecanismos de regulación de la temperatura corporal, que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Edades extremas (recién nacidos, ancianos).",
                    "Peso extremo (obesidad, bajo peso).",
                    "Alteración de la tasa metabólica (hiper/hipotiroidismo).",
                    "Deshidratación.",
                    "Inactividad o actividad vigorosa.",
                    "Exposición a ambientes fríos/calientes.",
                    "Ropa inadecuada para la temperatura ambiental.",
                    "Enfermedad o traumatismo que afecta la regulación de la temperatura (lesión hipotalámica, ACV).",
                    "Sedación, anestesia.",
                    "Medicación que afecta la termorregulación (vasodilatadores, vasoconstrictores, diuréticos, fenotiazinas)."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente mantendrá la temperatura corporal dentro de los límites normales (36.5°C - 37.5°C). (NOC 0800 Termorregulación)",
                    "El paciente identificará factores de riesgo para el desequilibrio térmico.",
                    "El paciente implementará medidas para prevenir la hipotermia o hipertermia.",
                    "El paciente no presentará signos de estrés térmico (escalofríos, piel fría/caliente, diaforesis excesiva)."
                    ],
                    "intervenciones": [
                    "Regulación de la Temperatura (NIC 3900): Monitorizar temperatura corporal regularmente. Ajustar la temperatura ambiental.",
                    "Monitorización de Signos Vitales (NIC 6680): Controlar temperatura, pulso, respiración, presión arterial.",
                    "Manejo Ambiental (NIC 6480): Proporcionar ropa de cama/vestimenta adecuada a la temperatura. Evitar exposición a corrientes de aire o calor excesivo.",
                    "Manejo de Líquidos (NIC 4120): Asegurar hidratación adecuada.",
                    "Identificación de Riesgos (NIC 6610): Evaluar factores de riesgo individuales.",
                    "Enseñanza: Proceso de Enfermedad/Prevención (NIC 5602): Educar al paciente/familia sobre factores de riesgo y medidas preventivas (ropa adecuada, hidratación, evitar temperaturas extremas)."
                    ]
                },
                {
                    "id": "00006",
                    "label": "Hipotermia",
                    "definicion": "Temperatura corporal central por debajo del rango normal diurno debido al fallo de la termorregulación.",
                    "relacionadoCon": [
                    "Exposición a ambiente frío (inmersión en agua fría, falta de calefacción).",
                    "Ropa inadecuada.",
                    "Consumo de alcohol.",
                    "Malnutrición.",
                    "Inactividad.",
                    "Edades extremas (recién nacidos, ancianos).",
                    "Daño al hipotálamo, traumatismo.",
                    "Disminución de la tasa metabólica (hipotiroidismo).",
                    "Medicación (sedantes, anestésicos).",
                    "Enfermedad (sepsis, hipoglucemia)."
                    ],
                    "manifestadoPor": [
                    "Reducción de la temperatura corporal por debajo del rango normal (<36.5°C).",
                    "Piel fría al tacto.",
                    "Palidez o cianosis (lechos ungueales, peribucal).",
                    "Escalofríos (pueden estar ausentes en hipotermia severa).",
                    "Piloerección.",
                    "Hipotensión.",
                    "Bradicardia.",
                    "Disminución del llenado capilar.",
                    "Confusión, letargia, somnolencia, coma.",
                    "Hipoxia.",
                    "Disminución de la frecuencia respiratoria.",
                    "Rigidez muscular."
                    ],
                    "resultadosEsperados": [
                    "El paciente alcanzará y mantendrá una temperatura corporal dentro de los límites normales. (NOC 0800 Termorregulación)",
                    "El paciente mostrará piel caliente y seca, coloración normal.",
                    "El paciente mantendrá constantes vitales estables.",
                    "El paciente recuperará su estado mental basal.",
                    "El paciente estará libre de escalofríos."
                    ],
                    "intervenciones": [
                    "Tratamiento de la Hipotermia (NIC 3800): Retirar ropa húmeda/fría. Proporcionar ambiente cálido.",
                    "Regulación de la Temperatura (NIC 3900): Aplicar medidas de recalentamiento pasivo (mantas) o activo externo (mantas térmicas, aire caliente forzado, lámparas de calor) o activo interno (líquidos IV calientes, lavado peritoneal/gástrico caliente) según severidad y protocolo.",
                    "Monitorización de la Temperatura Corporal: Control continuo o frecuente.",
                    "Monitorización de Signos Vitales (NIC 6680): Controlar FC, FR, PA, SpO2.",
                    "Monitorización Neurológica (NIC 2620): Evaluar nivel de conciencia.",
                    "Monitorización Cardíaca: Vigilar arritmias (riesgo de fibrilación ventricular con recalentamiento rápido).",
                    "Manejo de Líquidos (NIC 4120): Administrar líquidos calientes (orales si consciente, IV si necesario).",
                    "Prevención de Lesiones Cutáneas: Manejar con cuidado la piel fría y frágil."
                    ]
                },
                {
                    "id": "00007",
                    "label": "Hipertermia",
                    "definicion": "Temperatura corporal central superior al rango normal diurno debido al fallo de la termorregulación.",
                    "relacionadoCon": [
                    "Exposición a ambiente cálido/húmedo.",
                    "Actividad vigorosa.",
                    "Ropa inadecuada.",
                    "Deshidratación.",
                    "Disminución de la capacidad para sudar.",
                    "Aumento de la tasa metabólica (infección, hipertiroidismo, feocromocitoma).",
                    "Enfermedad o traumatismo que afecta la regulación de la temperatura (lesión hipotalámica).",
                    "Medicación (anticolinérgicos, anestésicos - hipertermia maligna, simpaticomiméticos)."
                    ],
                    "manifestadoPor": [
                    "Aumento de la temperatura corporal por encima del rango normal (>37.5°C - 38°C).",
                    "Piel caliente y enrojecida.",
                    "Piel seca o húmeda (diaforesis).",
                    "Taquicardia.",
                    "Taquipnea.",
                    "Hipotensión (tardía, por vasodilatación y deshidratación).",
                    "Cefalea.",
                    "Malestar general, debilidad.",
                    "Irritabilidad, confusión, delirio, convulsiones, coma (en casos severos como golpe de calor)."
                    ],
                    "resultadosEsperados": [
                    "El paciente alcanzará y mantendrá una temperatura corporal dentro de los límites normales. (NOC 0800 Termorregulación)",
                    "El paciente mostrará piel fresca y seca, coloración normal.",
                    "El paciente mantendrá constantes vitales estables.",
                    "El paciente recuperará su estado mental basal.",
                    "El paciente mantendrá una hidratación adecuada."
                    ],
                    "intervenciones": [
                    "Tratamiento de la Hipertermia (NIC 3786): Retirar exceso de ropa/ropa de cama. Proporcionar ambiente fresco.",
                    "Regulación de la Temperatura (NIC 3900): Aplicar medidas de enfriamiento externo (compresas frías/húmedas en cuello, axilas, ingles; ventilador; baño tibio; mantas de enfriamiento).",
                    "Monitorización de la Temperatura Corporal: Control frecuente.",
                    "Monitorización de Signos Vitales (NIC 6680): Controlar FC, FR, PA, SpO2.",
                    "Manejo de Líquidos (NIC 4120): Fomentar ingesta de líquidos fríos orales. Administrar líquidos IV fríos si es necesario/prescrito.",
                    "Administración de Medicación: Antipiréticos (NIC 2300): Administrar paracetamol o ibuprofeno si la hipertermia es por fiebre (origen infeccioso/inflamatorio), no suelen ser efectivos en golpe de calor.",
                    "Monitorización Neurológica (NIC 2620): Evaluar nivel de conciencia y signos de irritación meníngea o convulsiones.",
                    "Precauciones contra Convulsiones (si aplica NIC 2690)."
                    ]
                },
                {
                    "id": "00008",
                    "label": "Termorregulación ineficaz",
                    "definicion": "Fluctuaciones de la temperatura entre la hipotermia y la hipertermia.",
                    "relacionadoCon": [
                    "Enfermedad o traumatismo que afecta el centro termorregulador (hipotálamo).",
                    "Inmadurez del centro termorregulador (recién nacidos, especialmente prematuros).",
                    "Envejecimiento (disminución de la eficiencia termorreguladora).",
                    "Fluctuaciones de la temperatura ambiental.",
                    "Sedación."
                    ],
                    "manifestadoPor": [
                    "Fluctuaciones de la temperatura corporal por encima y por debajo de los rangos normales.",
                    "Aumento leve de la frecuencia respiratoria.",
                    "Aumento leve de la frecuencia cardíaca.",
                    "Piel fría o caliente al tacto.",
                    "Cianosis en lechos ungueales.",
                    "Piloerección.",
                    "Llenado capilar lento.",
                    "Hipertensión o hipotensión (según la fluctuación).",
                    "Irritabilidad, letargia."
                    ],
                    "resultadosEsperados": [
                    "El paciente mantendrá la temperatura corporal estable y dentro de los límites normales. (NOC 0800 Termorregulación / NOC 0801 Termorregulación: neonato)",
                    "El paciente no presentará fluctuaciones amplias de temperatura.",
                    "El paciente mostrará signos de confort térmico (piel de temperatura y color normal, ausencia de escalofríos/diaforesis excesiva)."
                    ],
                    "intervenciones": [
                    "Regulación de la Temperatura (NIC 3900): Monitorizar temperatura frecuentemente. Mantener un ambiente térmico neutro (ajustar temperatura ambiental, usar incubadora/cuna térmica en neonatos).",
                    "Monitorización de Signos Vitales (NIC 6680): Controlar temperatura, FC, FR, PA.",
                    "Cuidados del Neonato/Lactante (si aplica): Minimizar pérdida de calor (mantener seco, cubrir cabeza, contacto piel con piel, precalentar superficies).",
                    "Manejo Ambiental (NIC 6480): Evitar exposición a cambios bruscos de temperatura o corrientes de aire.",
                    "Vestimenta/Ropa de Cama: Ajustar según necesidad para mantener normotermia.",
                    "Vigilancia (NIC 6650): Observar signos de estrés por frío o calor."
                    ]
                },
                {
                    "id": "00010",
                    "label": "Riesgo de disreflexia autónoma",
                    "definicion": "Susceptible a una respuesta no inhibida del sistema nervioso simpático, potencialmente mortal, en una persona con lesión medular a nivel D6 o superior (después de la fase de shock medular), que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Presencia de lesión medular a nivel D6 o superior.",
                    "Estímulo nocivo por debajo del nivel de la lesión:",
                    "  - Estimulación vesical (distensión vesical por retención/obstrucción de sonda, infección urinaria, litiasis, procedimientos urológicos).",
                    "  - Estimulación intestinal (distensión intestinal por estreñimiento/impactación fecal, estimulación rectal digital, hemorroides, fisuras).",
                    "  - Estimulación cutánea (úlceras por presión, ropa ajustada, estímulos dolorosos/táctiles intensos, quemaduras, uñas encarnadas).",
                    "  - Otros estímulos (fracturas, procedimientos quirúrgicos/diagnósticos, relaciones sexuales, menstruación, parto)."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente permanecerá libre de episodios de disreflexia autónoma. (NOC 0910 Estado neurológico: control autónomo)",
                    "Se identificarán y eliminarán/minimizarán los estímulos desencadenantes.",
                    "El paciente o cuidador reconocerá los signos precoces de disreflexia autónoma y las acciones inmediatas a tomar.",
                    "El paciente mantendrá la presión arterial dentro de límites seguros."
                    ],
                    "intervenciones": [
                    "Manejo de la Disreflexia (NIC 2620): ¡ACTUACIÓN URGENTE SI SE PRODUCE!",
                    "  - ELEVAR CABECERA INMEDIATAMENTE (90º) para inducir hipotensión ortostática.",
                    "  - Monitorizar PA cada 2-5 minutos.",
                    "  - Aflojar ropa ajustada, vendajes, etc.",
                    "  - BUSCAR Y ELIMINAR EL ESTÍMULO DESENCADENANTE:",
                    "    * Comprobar permeabilidad de sonda vesical, vaciar vejiga (sondar si hay retención).",
                    "    * Comprobar distensión/impactación rectal (aplicar anestésico local antes de explorar/desimpactar).",
                    "    * Inspeccionar piel en busca de lesiones/presión.",
                    "  - Administrar antihipertensivos de acción rápida (nifedipino, nitratos) según prescripción/protocolo si la PA sigue elevada tras eliminar estímulo.",
                    "  - Notificar al médico.",
                    "Prevención:",
                    "  - Manejo Intestinal (NIC 0430): Programa regular para prevenir estreñimiento/impactación.",
                    "  - Manejo de la Eliminación Urinaria (NIC 0590): Asegurar vaciado vesical regular (sondaje intermitente, verificar permeabilidad de sonda permanente).",
                    "  - Cuidados de la Piel/Prevención UPP (NIC 3590 / 3540): Inspección regular, alivio de presión.",
                    "  - Educación al Paciente/Familia (NIC 5602): Enseñar causas, síntomas (cefalea intensa/pulsátil, HTA severa, bradicardia, diaforesis/piel roja por encima de lesión, piloerección) y manejo inicial urgente."
                    ]
                },
                {
                    "id": "00024",
                    "label": "Perfusión tisular inefectiva (general/sistémica)",
                    "definicion": "Disminución de la circulación sanguínea a nivel capilar que resulta en una entrega de oxígeno inadecuada para satisfacer las demandas metabólicas de los tejidos corporales a nivel sistémico. (Nota: NANDA-I no tiene un diagnóstico 'general', se usa para reflejar hipoperfusión sistémica como en shock).",
                    "relacionadoCon": [
                    "Hipovolemia (hemorragia, deshidratación severa).",
                    "Disminución del gasto cardíaco (insuficiencia cardíaca, infarto, arritmias).",
                    "Vasodilatación o vasoconstricción extrema (sepsis, shock anafiláctico, shock neurogénico).",
                    "Obstrucción del flujo sanguíneo (embolia pulmonar masiva, taponamiento cardíaco).",
                    "Hipoxemia severa."
                    ],
                    "manifestadoPor": [
                    "Órganos vitales:",
                    "  - Cerebral: Alteración del estado mental (agitación, confusión, letargia, coma).",
                    "  - Cardíaco: Taquicardia/bradicardia, arritmias, dolor torácico, hipotensión.",
                    "  - Pulmonar: Taquipnea, disnea, hipoxemia (SpO2 baja).",
                    "  - Renal: Oliguria o anuria, aumento de creatinina/BUN.",
                    "  - Gastrointestinal: Íleo paralítico, disminución de ruidos intestinales, sangrado GI.",
                    "Periférico:",
                    "  - Piel fría, pálida, húmeda, cianótica o moteada.",
                    "  - Llenado capilar prolongado (>3 seg).",
                    "  - Pulsos periféricos débiles o ausentes.",
                    "Generales:",
                    "  - Acidosis metabólica (lactato elevado).",
                    "  - Hipotermia."
                    ],
                    "resultadosEsperados": [
                    "El paciente mantendrá una perfusión tisular adecuada en órganos vitales y periferia. (NOC 0401 Estado circulatorio, NOC 0406 Perfusión tisular: cerebral, NOC 0414 Estado cardiopulmonar, NOC 0407 Perfusión tisular: periférica, NOC 0504 Función renal)",
                    "El paciente mostrará constantes vitales y parámetros hemodinámicos estabilizados.",
                    "El paciente mantendrá un estado mental orientado.",
                    "El paciente mantendrá una diuresis adecuada (>0.5 ml/kg/hr).",
                    "El paciente tendrá piel caliente, seca y de color normal."
                    ],
                    "intervenciones": [
                    "Manejo del Shock (NIC 4250 - especificar tipo: cardiogénico, hipovolémico, séptico, etc.): Monitorización hemodinámica intensiva. Identificar y tratar causa subyacente.",
                    "Monitorización de Signos Vitales (NIC 6680): Control continuo/frecuente.",
                    "Regulación Hemodinámica (NIC 4150): Administración de fluidos IV, vasopresores, inotrópicos según tipo de shock y prescripción.",
                    "Oxigenoterapia (NIC 3320) / Manejo de la Ventilación Mecánica (NIC 3300): Optimizar oxigenación.",
                    "Monitorización Neurológica (NIC 2620): Evaluar estado mental.",
                    "Monitorización de Líquidos (NIC 4130): Control estricto de balance hídrico.",
                    "Cuidados Circulatorios (NIC 406x): Evaluar perfusión periférica.",
                    "Monitorización de Resultados de Laboratorio: Gases arteriales, lactato, función renal/hepática, hemograma."
                    ]
                },
                {
                    "id": "00035",
                    "label": "Riesgo de lesión",
                    "definicion": "Susceptible a sufrir una lesión como resultado de la interacción de condiciones ambientales con los recursos adaptativos y defensivos de la persona, que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Factores externos (ambientales):",
                    "  - Físicos: Diseño/construcción/mantenimiento inseguro de edificios/equipos, desorden, suelos resbaladizos, iluminación inadecuada, falta de dispositivos de seguridad (barandillas, cinturones), exposición a humo/fuego, exposición a tóxicos/venenos, exposición a ruido excesivo, clima (hielo, calor extremo), transporte inseguro.",
                    "  - Químicos: Exposición a fármacos (efectos secundarios), venenos, contaminantes.",
                    "  - Biológicos: Exposición a microorganismos patógenos, estado de inmunización deficiente, animales/plantas venenosas.",
                    "Factores internos (personales):",
                    "  - Fisiológicos: Edad (extremos), deterioro de la movilidad, deterioro sensorial (visión, audición, tacto), deterioro cognitivo (confusión, demencia), falta de sueño, fatiga, enfermedad aguda/crónica, desnutrición, hipoxia tisular.",
                    "  - Psicológicos: Orientación afectiva, nivel de estrés.",
                    "  - Falta de conocimientos sobre precauciones de seguridad."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente permanecerá libre de lesiones. (NOC 1912 Caída: incidencia / NOC 1902 Control del riesgo)",
                    "El paciente y/o cuidador identificarán factores de riesgo de lesión en el entorno y personales.",
                    "El paciente y/o cuidador implementarán estrategias para modificar el entorno y/o la conducta para prevenir lesiones.",
                    "El paciente utilizará correctamente los dispositivos de seguridad/protección."
                    ],
                    "intervenciones": [
                    "Manejo Ambiental: Seguridad (NIC 6486): Identificar y eliminar peligros ambientales (iluminación, obstáculos, suelos). Asegurar equipos en buen estado. Proporcionar dispositivos de ayuda (barras, timbres de llamada).",
                    "Prevención de Caídas (NIC 6490): Evaluar riesgo. Implementar medidas específicas (cama baja, calzado antideslizante, supervisión).",
                    "Vigilancia: Seguridad (NIC 6654): Observar al paciente y el entorno para detectar riesgos potenciales.",
                    "Identificación de Riesgos (NIC 6610): Evaluar factores de riesgo individuales (movilidad, cognición, sensorial).",
                    "Educación para la Salud (NIC 5510): Enseñar sobre precauciones de seguridad específicas (prevención de quemaduras, intoxicaciones, seguridad vial, etc.).",
                    "Restricción Física (NIC 6580): Utilizar como último recurso, siguiendo protocolo estricto, para prevenir lesiones a sí mismo o a otros.",
                    "Manejo de la Medicación (NIC 2380): Revisar efectos secundarios que aumenten riesgo de lesión (mareo, sedación).",
                    "Prevención de Aspiración (NIC 3200) / Prevención de Úlceras por Presión (NIC 3540) / Control de Infecciones (NIC 6540): Implementar medidas específicas según riesgos identificados."
                    ]
                },
                {
                    "id": "00038",
                    "label": "Riesgo de traumatismo físico",
                    "definicion": "Susceptible a sufrir una lesión tisular accidental (p. ej., herida, quemadura, fractura), que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Factores externos:",
                    "  - Exposición a maquinaria/vehículos/herramientas peligrosas.",
                    "  - Exposición a alturas.",
                    "  - Presencia de objetos cortantes/punzantes.",
                    "  - Entorno desordenado/inseguro (riesgo de caídas, golpes).",
                    "  - Armas de fuego.",
                    "  - Fuentes de calor/electricidad/productos químicos.",
                    "  - Falta de uso de equipos de protección (cascos, cinturones de seguridad).",
                    "Factores internos:",
                    "  - Debilidad, falta de equilibrio/coordinación.",
                    "  - Deterioro visual/auditivo.",
                    "  - Deterioro cognitivo (falta de juicio, impulsividad).",
                    "  - Falta de conocimientos sobre precauciones de seguridad.",
                    "  - Historial de traumatismos previos.",
                    "  - Fatiga.",
                    "  - Consumo de alcohol/drogas."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente permanecerá libre de traumatismos físicos. (NOC 1913 Estado de seguridad: lesión física)",
                    "El paciente y/o cuidador identificarán peligros potenciales en el entorno.",
                    "El paciente y/o cuidador describirán y aplicarán medidas para prevenir traumatismos.",
                    "El paciente utilizará equipos de protección adecuados cuando sea necesario."
                    ],
                    "intervenciones": [
                    "Prevención de Caídas (NIC 6490): Medidas específicas para evitar caídas.",
                    "Manejo Ambiental: Seguridad (NIC 6486): Identificar y corregir peligros específicos (objetos cortantes, cables sueltos, etc.).",
                    "Educación para la Salud (NIC 5510): Enseñar sobre seguridad en el hogar, en el trabajo, vial. Uso de equipos de protección.",
                    "Vigilancia: Seguridad (NIC 6654): Supervisión de personas con alto riesgo (niños, ancianos, personas con deterioro cognitivo/movilidad).",
                    "Identificación de Riesgos (NIC 6610): Evaluar factores de riesgo individuales.",
                    "Prevención de Quemaduras: Ajustar temperatura del agua caliente, mantener cerillas/mecheros fuera del alcance de niños, protectores en enchufes.",
                    "Prevención de Asfixia: Cortar alimentos pequeños para niños, evitar objetos pequeños a su alcance.",
                    "Asesoramiento sobre Seguridad Infantil: Uso de sillas de coche, seguridad en el hogar."
                    ]
                },
                {
                    "id": "00043",
                    "label": "Protección inefectiva",
                    "definicion": "Disminución de la capacidad para autoprotegerse de amenazas internas o externas, como enfermedades o lesiones.",
                    "relacionadoCon": [
                    "Perfiles sanguíneos anormales (leucopenia, trombocitopenia, anemia, alteración de factores de coagulación).",
                    "Tratamientos (quimioterapia, radioterapia, inmunosupresores, anticoagulantes, cirugía).",
                    "Trastornos inmunitarios (VIH/SIDA, inmunodeficiencias congénitas).",
                    "Cáncer.",
                    "Desnutrición.",
                    "Edades extremas.",
                    "Abuso de sustancias.",
                    "Trastornos como diabetes mellitus (riesgo de infección, mala cicatrización)."
                    ],
                    "manifestadoPor": [
                    "Deficiencia inmunitaria.",
                    "Alteración de la coagulación (sangrado, hematomas fáciles).",
                    "Debilidad, fatiga.",
                    "Desorientación, alteración de la percepción.",
                    "Disnea.",
                    "Tos.",
                    "Prurito.",
                    "Inquietud, agitación.",
                    "Insomnio.",
                    "Lesiones (heridas que no cicatrizan, úlceras por presión).",
                    "Sudoración.",
                    "Síntomas de infección recurrente o persistente."
                    ],
                    "resultadosEsperados": [
                    "El paciente estará libre de signos de infección. (NOC 0703 Severidad de la infección)",
                    "El paciente estará libre de sangrado significativo. (NOC 0413 Severidad de la pérdida de sangre)",
                    "El paciente mantendrá la integridad cutánea y de las mucosas. (NOC 1101 Integridad tisular: piel y membranas mucosas)",
                    "El paciente identificará y evitará factores de riesgo para infección/sangrado/lesión.",
                    "El paciente demostrará conductas de autoprotección."
                    ],
                    "intervenciones": [
                    "Protección contra las Infecciones (NIC 6550): Vigilar signos de infección. Mantener asepsia. Aislar si es necesario. Administrar antibióticos/antifúngicos.",
                    "Precauciones contra la Hemorragia (NIC 4010): Vigilar signos de sangrado. Evitar traumatismos. Monitorizar plaquetas/coagulación. Administrar hemoderivados.",
                    "Vigilancia de la Piel (NIC 3590): Inspeccionar piel y mucosas. Prevenir lesiones.",
                    "Manejo de la Inmunización/Vacunación (NIC 6530): Administrar vacunas según pauta e indicación.",
                    "Manejo de la Nutrición (NIC 1100): Asegurar ingesta adecuada para apoyar sistema inmune y coagulación.",
                    "Manejo de la Energía (NIC 0180): Equilibrar actividad y reposo.",
                    "Enseñanza: Autocuidado (NIC 5602): Educar sobre medidas de higiene, prevención de infecciones, reconocimiento de signos de sangrado/infección.",
                    "Manejo Ambiental: Seguridad (NIC 6486): Reducir riesgos ambientales."
                    ]
                },
                {
                    "id": "00045",
                    "label": "Deterioro de la mucosa oral",
                    "definicion": "Lesión de los labios, tejidos blandos de la cavidad oral y/o orofaringe.",
                    "relacionadoCon": [
                    "Factores patológicos: Infección (viral, fúngica, bacteriana), enfermedades autoinmunes, cáncer oral.",
                    "Factores relacionados con el tratamiento: Quimioterapia, radioterapia de cabeza/cuello, inmunosupresión, NPO (nada por boca) > 24h, intubación prolongada, cirugía oral.",
                    "Factores mecánicos: Prótesis dentales mal ajustadas, ortodoncia, cepillado dental traumático, respiración bucal.",
                    "Deshidratación, boca seca (xerostomía) inducida por fármacos (anticolinérgicos, antihistamínicos) o enfermedades (Sjögren).",
                    "Mala higiene oral.",
                    "Desnutrición (déficit de vitaminas).",
                    "Consumo de alcohol o tabaco.",
                    "Estrés."
                    ],
                    "manifestadoPor": [
                    "Lengua y mucosas cubiertas (saburrales), pálidas o enrojecidas.",
                    "Xerostomía (boca seca).",
                    "Estomatitis (inflamación de la mucosa).",
                    "Lesiones orales (úlceras, aftas, vesículas, placas blancas - candidiasis).",
                    "Sangrado gingival o de mucosas.",
                    "Glositis (inflamación de la lengua), lengua fisurada.",
                    "Mal aliento (halitosis).",
                    "Dolor o molestias orales.",
                    "Dificultad para comer, tragar o hablar.",
                    "Disminución o alteración del gusto."
                    ],
                    "resultadosEsperados": [
                    "El paciente mantendrá la mucosa oral intacta, húmeda y de color rosado. (NOC 1100 Salud oral)",
                    "El paciente referirá ausencia de dolor o molestias orales.",
                    "El paciente mantendrá una higiene oral adecuada.",
                    "El paciente será capaz de comer y beber cómodamente.",
                    "El paciente identificará factores de riesgo y medidas preventivas."
                    ],
                    "intervenciones": [
                    "Restablecimiento de la Salud Oral (NIC 1710): Valorar estado de la mucosa oral diariamente (usar escala de valoración).",
                    "Higiene Bucal (NIC 1710): Realizar o enseñar higiene oral después de comidas y al acostarse (cepillo suave, pasta no irritante, seda dental con cuidado). Enjuagar con solución salina o bicarbonatada (evitar colutorios con alcohol).",
                    "Manejo del Dolor (NIC 1400): Administrar analgésicos tópicos (lidocaína viscosa) o sistémicos según prescripción.",
                    "Manejo de Líquidos/Nutrición (NIC 4120 / 1100): Fomentar ingesta de líquidos. Ofrecer dieta blanda, no irritante (evitar ácidos, picantes, alimentos duros/secos).",
                    "Tratamiento de la Boca Seca: Usar sustitutos de saliva, humidificadores. Fomentar sorbos frecuentes de agua. Evitar cafeína/alcohol.",
                    "Administración de Medicación Tópica/Sistémica: Aplicar/administrar antifúngicos, antivirales, antibióticos si hay infección.",
                    "Enseñanza: Cuidado Oral (NIC 5602): Educar sobre técnicas de higiene, dieta, signos de complicación.",
                    "Vigilancia de la Piel (y mucosas) (NIC 3590)."
                    ]
                },
                {
                    "id": "00048",
                    "label": "Deterioro de la dentición",
                    "definicion": "Alteración de las piezas dentarias o de las estructuras de soporte.",
                    "relacionadoCon": [
                    "Higiene oral ineficaz.",
                    "Barreras para el autocuidado oral (físicas, económicas, cognitivas).",
                    "Ingesta excesiva de azúcares, carbohidratos o alimentos ácidos.",
                    "Deficiencias nutricionales (calcio, flúor, vitaminas).",
                    "Boca seca crónica (xerostomía).",
                    "Bruxismo.",
                    "Sensibilidad a calor/frío.",
                    "Falta de acceso a cuidados dentales regulares.",
                    "Conocimientos deficientes sobre salud dental.",
                    "Vómitos crónicos (exposición a ácido gástrico).",
                    "Consumo de tabaco."
                    ],
                    "manifestadoPor": [
                    "Caries dentales.",
                    "Pérdida de piezas dentales.",
                    "Dientes fracturados o astillados.",
                    "Maloclusión o alineación incorrecta.",
                    "Desgaste del esmalte.",
                    "Placa dental o sarro excesivo.",
                    "Mal aliento (halitosis) persistente.",
                    "Dolor dental (odontalgia).",
                    "Abscesos dentales.",
                    "Gingivitis o periodontitis (encías inflamadas, sangrantes, retraídas).",
                    "Dientes flojos.",
                    "Dificultad o dolor al masticar."
                    ],
                    "resultadosEsperados": [
                    "El paciente mantendrá o mejorará la salud de sus dientes y estructuras de soporte. (NOC 1100 Salud oral)",
                    "El paciente demostrará una higiene oral adecuada.",
                    "El paciente referirá ausencia de dolor dental.",
                    "El paciente buscará atención dental regular.",
                    "El paciente identificará y modificará factores de riesgo para el deterioro dental."
                    ],
                    "intervenciones": [
                    "Restablecimiento de la Salud Oral (NIC 1710): Valorar estado de la dentición y encías. Identificar problemas.",
                    "Fomento de la Salud Bucodental (NIC 1710): Enseñar técnicas correctas de cepillado y uso de hilo dental. Recomendar pasta dental con flúor.",
                    "Asesoramiento Nutricional (NIC 5246): Aconsejar sobre dieta equilibrada, limitando azúcares y ácidos.",
                    "Manejo del Dolor (NIC 1400): Si hay dolor dental.",
                    "Derivación: Referir al dentista para revisión, limpieza y tratamiento.",
                    "Ayuda con los Autocuidados: Higiene Oral (si el paciente tiene limitaciones físicas/cognitivas).",
                    "Enseñanza: Proceso de Enfermedad (NIC 5602): Educar sobre la importancia de la salud dental y los cuidados preventivos."
                    ]
                },
                {
                    "id": "00053",
                    "label": "Aislamiento social",
                    "definicion": "Soledad experimentada por la persona y percibida como impuesta por otros y como un estado negativo o amenazador.",
                    "relacionadoCon": [
                    "Factores que contribuyen a la ausencia de relaciones personales satisfactorias (retraso en el logro de tareas del desarrollo, alteración del aspecto físico, alteración del estado mental, conducta socialmente inaceptable).",
                    "Recursos personales inadecuados (falta de habilidades sociales, intereses limitados).",
                    "Incapacidad para establecer relaciones personales satisfactorias.",
                    "Pérdida de seres queridos, divorcio.",
                    "Falta de transporte.",
                    "Barreras de comunicación.",
                    "Enfermedad física o mental.",
                    "Cambio de entorno (mudanza, institucionalización)."
                    ],
                    "manifestadoPor": [
                    "Expresión de sentimientos de soledad, rechazo o de ser diferente a los demás.",
                    "Falta de sistema de apoyo significativo (familia, amigos, grupo).",
                    "Retraimiento, falta de contacto visual.",
                    "Tristeza, apatía, ansiedad.",
                    "Conducta no comunicativa o sin sentido.",
                    "Preocupación por los propios pensamientos, irritabilidad.",
                    "Búsqueda de estar solo o existencia en una subcultura.",
                    "Inseguridad en público.",
                    "Expresión de sentimientos de abandono.",
                    "Hostilidad.",
                    "Aspecto físico descuidado."
                    ],
                    "resultadosEsperados": [
                    "El paciente participará en actividades sociales deseadas. (NOC 1503 Implicación social)",
                    "El paciente expresará sentimientos de pertenencia y conexión social. (NOC 1205 Autoestima)",
                    "El paciente identificará y utilizará recursos de apoyo social.",
                    "El paciente demostrará habilidades sociales adecuadas.",
                    "El paciente disminuirá los sentimientos de soledad y aislamiento."
                    ],
                    "intervenciones": [
                    "Fomento de la Socialización (NIC 5100): Animar a la interacción con otros. Ayudar a identificar actividades grupales de interés. Facilitar la participación.",
                    "Aumentar los Sistemas de Apoyo (NIC 5440): Identificar red de apoyo existente. Fomentar el contacto con familia/amigos. Informar sobre grupos de apoyo o recursos comunitarios.",
                    "Mejora de la Autoestima (NIC 5400): Ayudar a identificar fortalezas personales. Fomentar cuidado personal.",
                    "Entrenamiento en Habilidades Sociales (NIC 5100): Enseñar y practicar habilidades de comunicación, escucha activa, asertividad.",
                    "Terapia de Reminiscencia/Validación (si aplica): Útil en ancianos o personas con demencia para fomentar conexión.",
                    "Presencia (NIC 5340): Pasar tiempo con el paciente, mostrando interés genuino.",
                    "Manejo Ambiental: Crear oportunidades para la interacción social.",
                    "Apoyo Emocional (NIC 5270): Permitir la expresión de sentimientos de soledad o rechazo."
                    ]
                },
                {
                    "id": "00054",
                    "label": "Riesgo de soledad",
                    "definicion": "Susceptible de experimentar una vaga disforia, que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Aislamiento físico.",
                    "Aislamiento social.",
                    "Pérdida de relaciones significativas (duelo, divorcio).",
                    "Falta de disponibilidad de personas significativas.",
                    "Barreras emocionales (miedo a la intimidad, falta de confianza).",
                    "Transiciones vitales (mudanza, jubilación, enfermedad crónica).",
                    "Alteración de la imagen corporal.",
                    "Dificultades de comunicación.",
                    "Falta de habilidades sociales."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente mantendrá relaciones sociales significativas. (NOC 1504 Soporte social)",
                    "El paciente expresará sentimientos de conexión y pertenencia.",
                    "El paciente participará en actividades sociales que le resulten satisfactorias.",
                    "El paciente identificará y utilizará estrategias para prevenir o mitigar la soledad.",
                    "El paciente no desarrollará sentimientos persistentes de soledad."
                    ],
                    "intervenciones": [
                    "Fomento de la Socialización (NIC 5100): Animar a mantener contactos sociales. Sugerir actividades grupales o voluntariado.",
                    "Aumentar los Sistemas de Apoyo (NIC 5440): Ayudar a identificar y fortalecer la red de apoyo.",
                    "Mejora de la Comunicación (NIC 4976): Facilitar expresión de sentimientos y necesidades.",
                    "Presencia (NIC 5340): Ofrecer compañía y escucha activa.",
                    "Identificación de Riesgos (NIC 6610): Evaluar factores que aumentan el riesgo de soledad.",
                    "Entrenamiento en Habilidades Sociales (NIC 5100): Si es necesario, mejorar habilidades para iniciar/mantener relaciones.",
                    "Fomento de la Autoestima (NIC 5400): Reforzar el valor personal.",
                    "Animar a la participación comunitaria: Conectar con grupos de interés, centros cívicos, actividades religiosas."
                    ]
                },
                {
                    "id": "00055",
                    "label": "Desempeño inefectivo del rol",
                    "definicion": "Patrón de conductas y autoexpresiones percibidas como insatisfactorias o inadecuadas para el contexto (edad, cultura, situación) relevante.",
                    "relacionadoCon": [
                    "Conflicto de roles (demandas incompatibles entre diferentes roles).",
                    "Sobrecarga de rol (excesivas demandas o responsabilidades).",
                    "Cambio en la imagen corporal o autoconcepto.",
                    "Cambio en el estado de salud (enfermedad, discapacidad).",
                    "Falta de conocimientos sobre el rol.",
                    "Falta de habilidades para desempeñar el rol.",
                    "Sistema de apoyo inadecuado.",
                    "Baja autoestima.",
                    "Fatiga, estrés.",
                    "Crisis situacionales (pérdida de empleo, divorcio, paternidad/maternidad).",
                    "Demandas del desarrollo (transiciones evolutivas)."
                    ],
                    "manifestadoPor": [
                    "Verbalización de insatisfacción o dificultad con el rol.",
                    "Verbalización de cambio en la percepción del rol o de sí mismo.",
                    "Conflicto de roles.",
                    "Negación del rol o incapacidad para asumirlo.",
                    "Ansiedad, depresión, apatía.",
                    "Falta de motivación.",
                    "Inadecuada adaptación al cambio.",
                    "Inseguridad.",
                    "Abandono de responsabilidades del rol.",
                    "Deterioro en las relaciones familiares o laborales."
                    ],
                    "resultadosEsperados": [
                    "El paciente identificará los factores que afectan al desempeño del rol. (NOC 1305 Adaptación psicosocial: cambio de vida)",
                    "El paciente describirá un desempeño del rol realista y satisfactorio. (NOC 1501 Desempeño del rol)",
                    "El paciente demostrará conductas acordes con el rol deseado/requerido.",
                    "El paciente utilizará estrategias de afrontamiento efectivas para manejar conflictos o sobrecarga de rol.",
                    "El paciente expresará mayor confianza en su capacidad para desempeñar el rol."
                    ],
                    "intervenciones": [
                    "Potenciación de Roles (NIC 5370): Ayudar al paciente a identificar los roles que desempeña y las expectativas asociadas. Clarificar conflictos o ambigüedades.",
                    "Aumentar el Afrontamiento (NIC 5230): Ayudar a desarrollar estrategias para manejar el estrés y las demandas del rol.",
                    "Apoyo Emocional (NIC 5270): Permitir la expresión de sentimientos sobre las dificultades del rol.",
                    "Mejora de la Autoestima (NIC 5400): Reforzar capacidades y logros.",
                    "Establecimiento de Metas Comunes (NIC 4410): Ayudar a definir metas realistas para el desempeño del rol.",
                    "Entrenamiento en Habilidades: Si la dificultad se debe a falta de habilidades (p. ej., para cuidado de hijos, manejo del hogar), proporcionar enseñanza o derivación.",
                    "Asesoramiento (NIC 5240): Facilitar la exploración de opciones y toma de decisiones.",
                    "Fomento de la Implicación Familiar (NIC 7110): Involucrar a la familia para renegociar roles y responsabilidades si es necesario."
                    ]
                },
                {
                    "id": "00060",
                    "label": "Interrupción de los procesos familiares",
                    "definicion": "Cambio en las relaciones o en el funcionamiento familiar.",
                    "relacionadoCon": [
                    "Crisis situacional o de desarrollo que afecta a un miembro de la familia (enfermedad, hospitalización, nacimiento, muerte, divorcio, pérdida de empleo, mudanza).",
                    "Cambio en los roles familiares.",
                    "Modificación en el estado de salud de un miembro de la familia.",
                    "Modificación en el estado económico de la familia.",
                    "Falta de apoyo entre los miembros de la familia.",
                    "Comunicación familiar ineficaz.",
                    "Incapacidad de la familia para satisfacer las necesidades (físicas, emocionales, espirituales) de sus miembros."
                    ],
                    "manifestadoPor": [
                    "Cambios en la participación afectiva entre los miembros.",
                    "Cambios en los patrones de comunicación.",
                    "Cambios en la participación en la solución de problemas o toma de decisiones.",
                    "Cambios en la satisfacción con la familia.",
                    "Cambios en la expresión de intimidad o autonomía.",
                    "Cambios en la asignación de tareas o desempeño de roles.",
                    "Dificultad para aceptar o recibir ayuda adecuadamente.",
                    "Expresión de aislamiento respecto a fuentes comunitarias.",
                    "Rigidez en funciones y reglas."
                    ],
                    "resultadosEsperados": [
                    "La familia demostrará un funcionamiento adaptativo a la situación de cambio/crisis. (NOC 2602 Funcionamiento de la familia)",
                    "La familia mantendrá una comunicación abierta y efectiva entre sus miembros. (NOC 2604 Normalización de la familia)",
                    "La familia expresará apoyo mutuo entre sus miembros.",
                    "La familia participará conjuntamente en la resolución de problemas.",
                    "La familia utilizará recursos externos de apoyo si es necesario."
                    ],
                    "intervenciones": [
                    "Mantenimiento de los Procesos Familiares (NIC 7130): Evaluar el impacto de la situación/enfermedad en la familia. Identificar fortalezas y debilidades familiares.",
                    "Fomento de la Implicación Familiar (NIC 7110): Involucrar a la familia en los cuidados y la toma de decisiones.",
                    "Apoyo Familiar (NIC 7140): Proporcionar información clara y honesta. Escuchar preocupaciones. Ofrecer apoyo emocional.",
                    "Fomento de la Comunicación Familiar: Facilitar reuniones familiares. Promover la expresión abierta de sentimientos y necesidades.",
                    "Movilización Familiar (NIC 7120): Ayudar a la familia a identificar y utilizar sus propios recursos y los de la comunidad.",
                    "Normalización Familiar (NIC 7200): Ayudar a la familia a integrar los cuidados/cambios en la rutina diaria.",
                    "Asesoramiento (NIC 5240): Ayudar a la familia a afrontar la crisis y adaptarse a los cambios.",
                    "Derivación: Referir a terapia familiar, grupos de apoyo o servicios sociales si es necesario."
                    ]
                },
                {
                    "id": "00062",
                    "label": "Riesgo de cansancio del rol de cuidador",
                    "definicion": "Susceptible de dificultad para desempeñar el rol de cuidador familiar, que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Gravedad o cronicidad de la enfermedad del receptor de cuidados.",
                    "Aumento previsto o actual de las necesidades de cuidado.",
                    "Duración prolongada del cuidado.",
                    "Complejidad/cantidad de tareas de cuidado.",
                    "Falta de respiro o descanso para el cuidador.",
                    "Aislamiento social del cuidador.",
                    "Apoyo social inadecuado o percibido como inadecuado.",
                    "Recursos económicos insuficientes.",
                    "Problemas de salud propios del cuidador (físicos o psicológicos).",
                    "Relación conflictiva previa con el receptor de cuidados.",
                    "Inexperiencia o falta de conocimientos/habilidades para el cuidado.",
                    "Demandas múltiples y conflictivas (trabajo, familia, cuidado).",
                    "Sexo femenino (mayor prevalencia estadística).",
                    "Incertidumbre sobre el futuro."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El cuidador mantendrá un nivel de bienestar físico y psicológico adecuado. (NOC 2208 Bienestar del cuidador principal)",
                    "El cuidador identificará y utilizará recursos de apoyo disponibles. (NOC 2600 Facilitación de la implicación familiar / NOC 2202 Preparación del cuidador familiar)",
                    "El cuidador utilizará estrategias de afrontamiento efectivas.",
                    "El cuidador equilibrará las demandas del cuidado con sus propias necesidades.",
                    "El cuidador expresará sentimientos de capacidad y control en su rol."
                    ],
                    "intervenciones": [
                    "Apoyo al Cuidador Principal (NIC 7040): Evaluar factores de riesgo. Establecer relación de apoyo.",
                    "Identificación de Riesgos (NIC 6610): Monitorizar signos precoces de cansancio (físicos, emocionales, sociales).",
                    "Fomento de la Implicación Familiar (NIC 7110): Ayudar a identificar y solicitar ayuda de otros familiares/amigos.",
                    "Identificación de Recursos: Informar sobre grupos de apoyo, servicios de respiro, ayuda a domicilio.",
                    "Aumentar el Afrontamiento (NIC 5230): Enseñar manejo del estrés, técnicas de relajación. Fomentar autocuidado.",
                    "Enseñanza: Habilidades de Cuidado (NIC 5602): Proporcionar formación para aumentar confianza.",
                    "Asesoramiento (NIC 5240): Ayudar a establecer límites, resolver conflictos.",
                    "Facilitar el Respiro del Cuidador: Animar y ayudar a planificar descansos regulares."
                    ]
                },
                {
                    "id": "00066",
                    "label": "Sufrimiento espiritual",
                    "definicion": "Estado de sufrimiento relacionado con la incapacidad de experimentar significado en la vida a través de conexiones con uno mismo, los demás, el mundo o un ser superior.",
                    "relacionadoCon": [
                    "Desafío al sistema de creencias o valores (dolor/sufrimiento, diagnóstico de enfermedad terminal, barreras al ritual espiritual).",
                    "Separación de la comunidad religiosa o cultural.",
                    "Pérdida percibida (de fe, de sentido, de propósito).",
                    "Crisis vitales (muerte, enfermedad grave, divorcio, pérdida de empleo).",
                    "Conflicto moral o ético.",
                    "Soledad, aislamiento social.",
                    "Incapacidad para practicar rituales espirituales."
                    ],
                    "manifestadoPor": [
                    "Expresiones de falta de significado, propósito o esperanza en la vida.",
                    "Cuestionamiento de la propia existencia o sistema de creencias.",
                    "Sentimientos de vacío, culpa, ira, abandono.",
                    "Incapacidad para experimentar amor, alegría, paz.",
                    "Alteración en prácticas espirituales (oración, meditación, asistencia a servicios religiosos).",
                    "Petición de asistencia espiritual.",
                    "Incapacidad para aceptar la situación (enfermedad, pérdida).",
                    "Trastornos del sueño, llanto.",
                    "Sentirse desconectado de sí mismo, de los demás o de un poder superior."
                    ],
                    "resultadosEsperados": [
                    "El paciente expresará un mayor sentido de conexión, significado y propósito en la vida. (NOC 2001 Salud espiritual)",
                    "El paciente identificará y utilizará fuentes de fortaleza y esperanza. (NOC 1201 Esperanza)",
                    "El paciente participará en prácticas espirituales/religiosas que le aporten consuelo.",
                    "El paciente expresará aceptación de la situación actual.",
                    "El paciente expresará disminución de sentimientos de culpa, ira o abandono."
                    ],
                    "intervenciones": [
                    "Apoyo Espiritual (NIC 5420): Mostrar presencia y escucha activa. Facilitar la expresión de sentimientos y creencias. Respetar valores del paciente.",
                    "Facilitar el Crecimiento Espiritual (NIC 5426): Ayudar a encontrar significado y propósito. Fomentar la conexión con fuentes de esperanza.",
                    "Escucha Activa (NIC 4920): Prestar atención a las preocupaciones espirituales.",
                    "Dar Esperanza (NIC 5310): Ayudar a identificar fortalezas y recursos. Fomentar una visión realista pero positiva.",
                    "Facilitar la Práctica Religiosa (NIC 5424): Ayudar a contactar con líderes espirituales/religiosos si lo desea. Facilitar rituales (oración, lectura).",
                    "Apoyo en el Duelo (NIC 5290): Si el sufrimiento está relacionado con una pérdida.",
                    "Clarificación de Valores (NIC 5480): Ayudar a explorar y clarificar creencias y valores personales.",
                    "Presencia (NIC 5340): Estar disponible para el paciente."
                    ]
                },
                {
                    "id": "00072",
                    "label": "Negación ineficaz",
                    "definicion": "Intento consciente o inconsciente de ignorar el conocimiento o significado de un evento para reducir la ansiedad/temor, en detrimento de la salud.",
                    "relacionadoCon": [
                    "Miedo a las consecuencias (muerte, pérdida de autonomía, impacto en el estilo de vida).",
                    "Amenaza percibida como intolerable.",
                    "Ansiedad o estrés abrumador.",
                    "Pérdida de control percibida.",
                    "Sistema de apoyo inadecuado.",
                    "Baja autoestima, sentimientos de culpa.",
                    "Necesidad de evitar conflictos o realidades desagradables."
                    ],
                    "manifestadoPor": [
                    "Retraso en la búsqueda o rechazo de atención sanitaria.",
                    "No percepción de la relevancia personal de los síntomas o peligros.",
                    "Minimización de los síntomas o de la gravedad de la situación.",
                    "Desplazamiento de la fuente de los síntomas a otros órganos.",
                    "Incapacidad para admitir el impacto de la enfermedad en el patrón de vida.",
                    "Uso de expresiones de desestimación al hablar de eventos dolorosos (\"solo es...\", \"no es nada\").",
                    "Actitud inapropiadamente alegre o despreocupada.",
                    "No cumplimiento del régimen terapéutico.",
                    "Evitación de temas relacionados con la enfermedad/situación."
                    ],
                    "resultadosEsperados": [
                    "El paciente reconocerá la realidad de la situación de salud y sus implicaciones. (NOC 1300 Aceptación: estado de salud)",
                    "El paciente expresará sentimientos relacionados con la situación (miedo, ansiedad).",
                    "El paciente participará en la toma de decisiones sobre su tratamiento.",
                    "El paciente cumplirá con el régimen terapéutico.",
                    "El paciente utilizará estrategias de afrontamiento más adaptativas."
                    ],
                    "intervenciones": [
                    "Aumentar el Afrontamiento (NIC 5230): Confrontar con cuidado y gradualmente las discrepancias entre la percepción del paciente y la realidad. Explorar los temores subyacentes.",
                    "Apoyo Emocional (NIC 5270): Crear un ambiente de confianza. Permitir la expresión de sentimientos sin juzgar. Validar la dificultad de la situación.",
                    "Escucha Activa (NIC 4920): Prestar atención a lo que el paciente dice y no dice.",
                    "Clarificación de Valores (NIC 5480): Ayudar a identificar qué es importante para el paciente y cómo la situación actual lo afecta.",
                    "Potenciación de la Conciencia de Sí Mismo (NIC 5390): Ayudar a reconocer el patrón de negación y sus consecuencias.",
                    "Enseñanza: Proceso de Enfermedad/Régimen Terapéutico (NIC 5602 / 5616): Proporcionar información clara y factual, adaptada a la capacidad de asimilación del paciente.",
                    "Establecimiento de Metas Comunes (NIC 4410): Implicar al paciente en la planificación de cuidados.",
                    "Presencia (NIC 5340): Estar disponible para discutir preocupaciones cuando el paciente esté listo."
                    ]
                },
                {
                    "id": "00086",
                    "label": "Riesgo de disfunción neurovascular periférica",
                    "definicion": "Susceptible a una alteración en la circulación, sensibilidad o movimiento de una extremidad, que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Traumatismo (fracturas, luxaciones).",
                    "Obstrucción vascular (trombosis, embolia).",
                    "Compresión mecánica (yesos, vendajes apretados, férulas, síndrome compartimental, posicionamiento inadecuado).",
                    "Cirugía ortopédica o vascular.",
                    "Quemaduras.",
                    "Inmovilización.",
                    "Edema."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente mantendrá una función neurovascular periférica adecuada en la(s) extremidad(es) afectada(s). (NOC 0407 Perfusión tisular: periférica / NOC 0913 Estado neurológico: periférico)",
                    "El paciente mostrará pulsos periféricos presentes y simétricos.",
                    "El paciente tendrá coloración, temperatura y llenado capilar normales en la extremidad.",
                    "El paciente mantendrá la sensibilidad (tacto, dolor) y movilidad (activa/pasiva) en la extremidad.",
                    "El paciente no presentará dolor desproporcionado, edema tenso o parestesias."
                    ],
                    "intervenciones": [
                    "Monitorización Neurovascular Periférica (NIC 2620 / similar a Cuidados circulatorios NIC 406x): Evaluar las 5 P (o más) en la extremidad afectada comparándola con la contralateral: Pulso, Palidez (Color), Parestesia (Sensibilidad), Parálisis (Movimiento), Dolor (Pain), Temperatura, Presión (Edema/Tensión). Realizar cada 1-2 horas inicialmente tras lesión/cirugía, luego espaciar según estabilidad.",
                    "Vigilancia (NIC 6650): Estar alerta a signos de compromiso neurovascular.",
                    "Manejo de la Presión (NIC 3500): Aflojar vendajes/yesos si están apretados (con orden médica si es yeso cerrado). Elevar la extremidad (si no hay contraindicación arterial) para reducir edema.",
                    "Aplicación de Frío: Si está indicado para reducir edema/inflamación.",
                    "Posicionamiento (NIC 0840): Evitar posiciones que comprometan la circulación.",
                    "Notificación Urgente: Informar inmediatamente al médico si se detectan signos de compromiso neurovascular (especialmente síndrome compartimental).",
                    "Enseñanza: Paciente/Familia (NIC 5602): Educar sobre los signos de alarma a vigilar y reportar."
                    ]
                },
                {
                    "id": "00087",
                    "label": "Riesgo de lesión postural perioperatoria",
                    "definicion": "Susceptible a cambios anatómicos y físicos accidentales como resultado de la postura o equipo usado durante un procedimiento quirúrgico/invasivo, que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Desorientación, alteración del nivel de conciencia (anestesia).",
                    "Inmovilización, relajación muscular.",
                    "Pérdida de reflejos protectores.",
                    "Deterioro sensorial/perceptual.",
                    "Obesidad o bajo peso.",
                    "Edades extremas.",
                    "Edema, deshidratación.",
                    "Hipotermia.",
                    "Anemia.",
                    "Procedimientos quirúrgicos prolongados.",
                    "Posición quirúrgica requerida (litotomía, prono, lateral).",
                    "Equipamiento quirúrgico (separadores, apoyabrazos, mesa quirúrgica)."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente no sufrirá lesiones (neurológicas, musculoesqueléticas, cutáneas) relacionadas con la posición perioperatoria. (NOC 1913 Estado de seguridad: lesión física)",
                    "El paciente mantendrá la integridad cutánea en puntos de presión.",
                    "El paciente mantendrá la función neurovascular periférica.",
                    "El paciente no referirá dolor o parestesias postoperatorias relacionadas con la posición."
                    ],
                    "intervenciones": [
                    "Posicionamiento: Quirúrgico (NIC 0842): Evaluar factores de riesgo del paciente. Seleccionar y preparar la mesa/accesorios adecuados. Colocar al paciente en la posición requerida asegurando alineación corporal neutra.",
                    "Prevención de Lesiones por Presión en Quirófano: Utilizar superficies de alivio de presión. Acolchar prominencias óseas (talones, codos, sacro, occipucio, maléolos, crestas ilíacas). Evitar contacto directo piel con metal.",
                    "Protección Nerviosa: Evitar hiperextensión/hiperabducción de extremidades. Acolchar zonas de paso de nervios superficiales (peroneo, cubital). Asegurar que los brazos estén bien posicionados y sujetos.",
                    "Monitorización Durante el Procedimiento: Reevaluar periódicamente la posición, puntos de presión y alineación.",
                    "Manejo Ambiental: Seguridad (NIC 6486): Asegurar que el equipo (placa de bisturí, manguito de isquemia) esté correctamente colocado y funcione bien.",
                    "Transferencia Segura: Utilizar suficientes personas y técnica adecuada para mover al paciente anestesiado.",
                    "Documentación: Registrar posición, dispositivos de protección usados y valoración de la piel/neurovascular antes y después."
                    ]
                },
                {
                    "id": "00088",
                    "label": "Deterioro de la deambulación",
                    "definicion": "Limitación del movimiento independiente a pie por el entorno.",
                    "relacionadoCon": [
                    "Deterioro del equilibrio.",
                    "Deterioro cognitivo.",
                    "Limitaciones ambientales (escaleras, superficies irregulares, distancia).",
                    "Miedo a las caídas.",
                    "Fuerza muscular insuficiente.",
                    "Resistencia disminuida.",
                    "Dolor.",
                    "Deterioro neuromuscular o musculoesquelético (artritis, fracturas, ACV, Parkinson).",
                    "Obesidad.",
                    "Deterioro visual.",
                    "Estado de ánimo depresivo."
                    ],
                    "manifestadoPor": [
                    "Incapacidad para deambular por superficies irregulares, subir/bajar escaleras o recorrer distancias requeridas.",
                    "Marcha alterada (pasos cortos, base de sustentación amplia, arrastrar pies, asimetría).",
                    "Necesidad de ayuda de persona o dispositivo (bastón, andador, muletas) para caminar.",
                    "Velocidad de la marcha disminuida.",
                    "Dificultad para iniciar la marcha.",
                    "Inestabilidad al caminar."
                    ],
                    "resultadosEsperados": [
                    "El paciente deambulará de forma segura, con o sin dispositivo de ayuda, la distancia deseada/requerida. (NOC 0200 Ambulación)",
                    "El paciente mantendrá el equilibrio durante la deambulación. (NOC 0202 Equilibrio)",
                    "El paciente demostrará el uso correcto de dispositivos de ayuda.",
                    "El paciente expresará mayor confianza al caminar.",
                    "El paciente permanecerá libre de caídas durante la deambulación."
                    ],
                    "intervenciones": [
                    "Terapia de Ejercicios: Ambulación (NIC 0221): Ayudar al paciente a iniciar la deambulación y aumentar progresivamente la distancia y duración. Proporcionar apoyo físico si es necesario.",
                    "Enseñanza: Uso de Dispositivos de Ayuda: Instruir sobre el uso correcto y seguro de bastón, andador o muletas.",
                    "Terapia de Ejercicios: Equilibrio (NIC 0222): Realizar ejercicios específicos para mejorar el equilibrio estático y dinámico.",
                    "Terapia de Ejercicios: Control Muscular (NIC 0226): Implementar ejercicios para fortalecer músculos de las piernas y tronco.",
                    "Prevención de Caídas (NIC 6490): Identificar riesgos. Asegurar entorno seguro. Recomendar calzado adecuado.",
                    "Manejo del Dolor (NIC 1400): Controlar el dolor que limita la deambulación.",
                    "Fomento de la Mecánica Corporal (NIC 0140): Enseñar postura correcta al caminar.",
                    "Derivación: Considerar fisioterapia para evaluación y tratamiento especializado."
                    ]
                },
                {
                    "id": "00091",
                    "label": "Deterioro de la movilidad en la cama",
                    "definicion": "Limitación de la capacidad para moverse independientemente en la cama.",
                    "relacionadoCon": [
                    "Deterioro neuromuscular o musculoesquelético.",
                    "Dolor.",
                    "Disminución de la fuerza o resistencia muscular.",
                    "Deterioro cognitivo.",
                    "Obesidad.",
                    "Medicación (sedantes).",
                    "Presencia de dispositivos externos (tracción, vías, drenajes).",
                    "Estado de ánimo depresivo, falta de motivación."
                    ],
                    "manifestadoPor": [
                    "Incapacidad para girarse de lado a lado.",
                    "Incapacidad para pasar de posición supina a sentada o viceversa.",
                    "Incapacidad para moverse hacia la cabecera o los pies de la cama.",
                    "Movimientos lentos o descoordinados en la cama.",
                    "Necesidad de ayuda de persona o dispositivo (trapecio, barandillas) para moverse en la cama."
                    ],
                    "resultadosEsperados": [
                    "El paciente se moverá en la cama de forma independiente o con la mínima ayuda/dispositivos necesarios. (NOC 0203 Movimiento coordinado / NOC 0210 Realización del traslado)",
                    "El paciente demostrará el uso seguro de dispositivos de ayuda (trapecio).",
                    "El paciente mantendrá la alineación corporal adecuada en la cama.",
                    "El paciente participará activamente en los cambios posturales."
                    ],
                    "intervenciones": [
                    "Terapia de Ejercicios: Movilidad en la Cama (NIC 0224 / similar): Enseñar y asistir en giros, uso de barandillas/trapecio para moverse, pasar a posición sentada.",
                    "Ayuda con los Autocuidados: Transferencia (NIC 1806): Asistir en los movimientos en cama como parte de la preparación para transferencias.",
                    "Posicionamiento (NIC 0840): Ayudar a mantener alineación corporal. Realizar cambios posturales pasivos si el paciente no puede moverse.",
                    "Manejo del Dolor (NIC 1400): Controlar dolor antes de intentar movilizar.",
                    "Fomento de la Fuerza Muscular: Implementar ejercicios isométricos o activo-asistidos en cama si es posible.",
                    "Prevención de Úlceras por Presión (NIC 3540): Asegurar movilización frecuente para aliviar presión.",
                    "Manejo Ambiental: Asegurar que barandillas/trapecio estén accesibles y funcionen correctamente."
                    ]
                },
                {
                    "id": "00094",
                    "label": "Riesgo de intolerancia a la actividad",
                    "definicion": "Susceptible a experimentar una falta de energía fisiológica o psicológica suficiente para tolerar o completar las actividades diarias requeridas o deseadas, que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Antecedentes de intolerancia previa.",
                    "Presencia de problemas circulatorios o respiratorios (insuficiencia cardíaca, EPOC, anemia).",
                    "Desacondicionamiento físico (reposo prolongado en cama, estilo de vida sedentario).",
                    "Convalecencia postquirúrgica.",
                    "Dolor.",
                    "Trastornos del sueño.",
                    "Depresión, falta de motivación.",
                    "Malnutrición."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente mantendrá la tolerancia a la actividad dentro de sus límites basales o mejorará progresivamente. (NOC 0005 Tolerancia a la actividad)",
                    "El paciente identificará factores de riesgo para la intolerancia.",
                    "El paciente utilizará estrategias de conservación de energía.",
                    "El paciente no mostrará signos de respuesta fisiológica anormal (FC, PA, SpO2) a la actividad habitual.",
                    "El paciente participará en un programa de aumento gradual de la actividad."
                    ],
                    "intervenciones": [
                    "Manejo de la Energía (NIC 0180): Evaluar nivel de actividad habitual y factores de riesgo. Planificar un aumento gradual de la actividad.",
                    "Monitorización de Signos Vitales (NIC 6680): Controlar respuesta fisiológica (FC, PA, SpO2, FR) antes, durante y después de la actividad.",
                    "Enseñanza: Actividad/Ejercicio Prescrito (NIC 5612): Educar sobre la importancia del ejercicio gradual y los signos de intolerancia.",
                    "Fomento del Ejercicio (NIC 0200): Animar a realizar actividades ligeras y progresivas.",
                    "Enseñanza: Técnicas de Conservación de Energía.",
                    "Identificación de Riesgos (NIC 6610): Reconocer pacientes con riesgo elevado.",
                    "Optimizar Factores Contribuyentes: Manejar dolor, mejorar sueño, tratar anemia/malnutrición, etc."
                    ]
                },
                {
                    "id": "00096",
                    "label": "Deprivación de sueño",
                    "definicion": "Períodos de tiempo prolongados sin sueño (suspensión natural, periódica y relativa de la conciencia).",
                    "relacionadoCon": [
                    "Malestar físico prolongado (dolor, náuseas, disnea).",
                    "Estimulación ambiental excesiva y mantenida (ruido, luz, interrupciones frecuentes en UCI/hospital).",
                    "Parasomnias (terrores nocturnos, sonambulismo).",
                    "Apnea del sueño no tratada.",
                    "Ansiedad o estrés prolongado.",
                    "Envejecimiento (cambios en la arquitectura del sueño).",
                    "Responsabilidades de cuidador.",
                    "Turnos de trabajo rotatorios o nocturnos.",
                    "Uso prolongado de medicación que altera el sueño.",
                    "Abstinencia de sustancias."
                    ],
                    "manifestadoPor": [
                    "Somnolencia diurna excesiva.",
                    "Disminución de la capacidad funcional, letargia, fatiga.",
                    "Agitación, irritabilidad, ansiedad, labilidad emocional.",
                    "Dificultad para concentrarse, deterioro de la memoria, pensamiento lento.",
                    "Percepciones erróneas (ilusiones, alucinaciones transitorias).",
                    "Hipersensibilidad al dolor.",
                    "Temblor de manos.",
                    "Cefalea.",
                    "Sensación de quemazón ocular.",
                    "Confusión aguda (delirio)."
                    ],
                    "resultadosEsperados": [
                    "El paciente recuperará un patrón de sueño adecuado y reparador. (NOC 0004 Sueño)",
                    "El paciente referirá sentirse descansado y con más energía.",
                    "El paciente mostrará mejora en la función cognitiva (concentración, memoria).",
                    "El paciente identificará y modificará factores que contribuyen a la deprivación.",
                    "El paciente no presentará signos de confusión o percepciones alteradas."
                    ],
                    "intervenciones": [
                    "Manejo de la Privación de Sueño (NIC 1850): Identificar y abordar la causa subyacente. Priorizar períodos de sueño ininterrumpido.",
                    "Mejorar el Sueño (NIC 1850): Implementar medidas de higiene del sueño de forma intensiva.",
                    "Manejo Ambiental: Confort/Ruido (NIC 6482 / 6484): Crear un entorno lo más oscuro, silencioso y tranquilo posible. Minimizar interrupciones nocturnas (agrupar cuidados).",
                    "Fomento del Reposo: Programar períodos de descanso durante el día si es posible, pero evitar siestas largas que interfieran con el sueño nocturno.",
                    "Manejo del Dolor/Ansiedad/Otros Síntomas (NIC 1400 / 5820): Controlar síntomas que impiden el sueño.",
                    "Monitorización Neurológica (NIC 2620): Evaluar estado mental y signos de delirio.",
                    "Administración de Medicación: Hipnóticos (NIC 2380): Considerar uso a corto plazo bajo prescripción si es necesario, pero priorizar medidas no farmacológicas.",
                    "Colaboración: Consultar sobre estudios del sueño si se sospecha apnea u otro trastorno primario del sueño."
                    ]
                },
                {
                    "id": "00099",
                    "label": "Mantenimiento ineficaz de la salud",
                    "definicion": "Incapacidad para identificar, gestionar y/o buscar ayuda para mantener la salud.",
                    "relacionadoCon": [
                    "Habilidades de comunicación deficientes.",
                    "Falta de habilidad para tomar decisiones adecuadas.",
                    "Conflicto de decisiones.",
                    "Recursos (económicos, sociales) insuficientes.",
                    "Afrontamiento individual ineficaz.",
                    "Duelo disfuncional.",
                    "Deterioro cognitivo o perceptivo.",
                    "Creencias de salud/espirituales conflictivas.",
                    "Falta de conocimientos sobre prácticas de salud básicas.",
                    "Falta de motivación, desesperanza.",
                    "Sistema de apoyo inadecuado."
                    ],
                    "manifestadoPor": [
                    "Falta demostrada de conocimiento sobre prácticas básicas de salud.",
                    "Incapacidad para asumir la responsabilidad de satisfacer las prácticas básicas de salud.",
                    "Falta demostrada de conducta adaptativa a los cambios internos o externos.",
                    "Historia de falta de conductas de búsqueda de salud.",
                    "Deterioro de los sistemas de apoyo personal.",
                    "Presencia de enfermedad/lesión prevenible."
                    ],
                    "resultadosEsperados": [
                    "El paciente identificará sus propias necesidades de mantenimiento de la salud. (NOC 1602 Conducta de fomento de la salud)",
                    "El paciente demostrará conductas que promueven la salud (dieta, ejercicio, revisiones, vacunación). (NOC 1603 Conducta de búsqueda de salud)",
                    "El paciente buscará ayuda de profesionales de la salud cuando sea necesario.",
                    "El paciente verbalizará un plan para mantener o mejorar su salud.",
                    "El paciente utilizará recursos comunitarios para el mantenimiento de la salud."
                    ],
                    "intervenciones": [
                    "Ayuda para Modificar el Autoconcepto (NIC 5330) / Mejora de la Autoestima (NIC 5400): Si la causa es baja autoestima o falta de motivación.",
                    "Educación para la Salud (NIC 5510): Proporcionar información sobre prácticas de salud preventivas (dieta, ejercicio, higiene, manejo del estrés, revisiones médicas, vacunación).",
                    "Aumentar el Afrontamiento (NIC 5230): Ayudar a desarrollar habilidades para manejar estresores.",
                    "Facilitar la Autorresponsabilidad (NIC 4480): Fomentar la toma de decisiones y la participación activa en el cuidado de la salud.",
                    "Identificación de Riesgos (NIC 6610): Ayudar al paciente a reconocer sus propios riesgos para la salud.",
                    "Guías Anticipatorias (NIC 5210): Proporcionar información sobre cambios esperados y cómo mantener la salud durante transiciones vitales.",
                    "Apoyo Social (NIC 5440): Conectar con recursos comunitarios y sistemas de apoyo.",
                    "Asesoramiento (NIC 5240): Ayudar a explorar barreras y desarrollar un plan de acción."
                    ]
                },
                {
                    "id": "00100",
                    "label": "Retraso en la recuperación quirúrgica",
                    "definicion": "Ampliación del número de días posoperatorios requeridos para iniciar y realizar actividades que mantengan la vida y la salud.",
                    "relacionadoCon": [
                    "Dolor posoperatorio.",
                    "Náuseas/vómitos persistentes.",
                    "Infección del sitio quirúrgico u otra infección posoperatoria.",
                    "Complicaciones quirúrgicas (hemorragia, íleo paralítico, complicaciones pulmonares).",
                    "Movilidad física deteriorada.",
                    "Estado nutricional preoperatorio deficiente o ingesta posoperatoria inadecuada.",
                    "Obesidad o bajo peso extremo.",
                    "Edad avanzada.",
                    "Enfermedades crónicas preexistentes (diabetes, EPOC, insuficiencia cardíaca/renal).",
                    "Tabaquismo.",
                    "Procedimiento quirúrgico extenso o traumático.",
                    "Falta de apoyo social.",
                    "Factores psicológicos (depresión, ansiedad, miedo)."
                    ],
                    "manifestadoPor": [
                    "Evidencia de interrupción de la curación de la zona quirúrgica (dehiscencia, infección).",
                    "Pérdida de apetito con o sin náuseas.",
                    "Fatiga, necesidad de más ayuda de la esperada para completar el autocuidado.",
                    "Dificultad para moverse en la cama o deambular (más de lo esperado para la etapa).",
                    "Informe verbal de dolor o malestar que impide la progresión.",
                    "Estancia hospitalaria prolongada.",
                    "Reingreso hospitalario.",
                    "Función disminuida respecto al nivel basal preoperatorio (retraso en volver a actividades habituales)."
                    ],
                    "resultadosEsperados": [
                    "El paciente progresará en la recuperación quirúrgica según lo esperado para el tipo de cirugía. (NOC 2305 Recuperación posoperatoria)",
                    "El paciente alcanzará un nivel de movilidad y autocuidado adecuado para el alta.",
                    "La herida quirúrgica mostrará signos de curación sin complicaciones.",
                    "El paciente manejará eficazmente el dolor posoperatorio.",
                    "El paciente mantendrá un estado nutricional adecuado para la cicatrización."
                    ],
                    "intervenciones": [
                    "Cuidados Posoperatorios (NIC 2880): Monitorizar constantes vitales, estado de la herida, dolor, función respiratoria/gastrointestinal/urinaria. Detectar precozmente complicaciones.",
                    "Manejo del Dolor (NIC 1400): Evaluar y tratar el dolor eficazmente.",
                    "Cuidados del Sitio de Incisión (NIC 3440): Vigilar signos de infección/dehiscencia. Realizar curas según pauta.",
                    "Manejo de Náuseas/Vómitos (NIC 1450 / 1570): Prevenir y tratar.",
                    "Asistencia en los Autocuidados (NIC 1800): Ayudar según necesidad, fomentando la independencia progresiva.",
                    "Fomento de la Movilización Precoz: Animar a levantarse y deambular según tolerancia y prescripción.",
                    "Manejo de la Nutrición (NIC 1100): Asegurar ingesta adecuada para cicatrización. Progresar dieta según tolerancia.",
                    "Prevención de Complicaciones Pulmonares: Fomentar tos, respiraciones profundas, espirometría incentiva.",
                    "Prevención de TVP: Medias de compresión, anticoagulación profiláctica, movilización.",
                    "Apoyo Emocional (NIC 5270): Abordar ansiedad o desánimo."
                    ]
                },
                {
                    "id": "00104",
                    "label": "Lactancia materna ineficaz",
                    "definicion": "Dificultad de la madre, el lactante o el niño para el proceso de amamantamiento.",
                    "relacionadoCon": [
                    "Madre: Anomalías mamarias (pezones planos/invertidos, ingurgitación, cirugía previa), dolor en pezones, fatiga, ansiedad, conocimientos deficientes sobre lactancia, falta de apoyo social/familiar, separación madre-hijo, suplementación con biberón.",
                    "Lactante: Prematuridad, anomalías orales (anquiloglosia, paladar hendido), succión débil o descoordinada, incapacidad para agarrar el pecho correctamente, ictericia, enfermedad.",
                    "Otros: Falta de confianza materna, interrupción de la lactancia."
                    ],
                    "manifestadoPor": [
                    "Madre: Dolor persistente en pezones después de la primera semana, ingurgitación mamaria, suministro de leche inadecuado percibido.",
                    "Lactante: Agarre inadecuado al pecho, arqueo/llanto en el pecho, succión ineficaz/insuficiente, signos de ingesta inadecuada (poca ganancia de peso, menos de 6-8 pañales mojados/día, heces escasas), resistencia a agarrarse al pecho.",
                    "Observación: Vaciamiento incompleto de las mamas, insatisfacción del lactante después de la toma."
                    ],
                    "resultadosEsperados": [
                    "La madre y el lactante establecerán un patrón de lactancia materna eficaz y satisfactorio. (NOC 1000 Establecimiento de la lactancia materna: lactante / NOC 1001 Establecimiento de la lactancia materna: madre)",
                    "El lactante demostrará un agarre y succión efectivos.",
                    "El lactante mostrará signos de ingesta adecuada (ganancia de peso, pañales mojados/sucios).",
                    "La madre expresará comodidad durante la lactancia y confianza en su capacidad.",
                    "La madre mantendrá la producción de leche adecuada."
                    ],
                    "intervenciones": [
                    "Asesoramiento en la Lactancia (NIC 5244): Evaluar la técnica de agarre y posicionamiento. Observar una toma completa.",
                    "Enseñanza: Lactancia Materna (NIC 5568 / 5244): Proporcionar información sobre técnica correcta, signos de buen agarre, frecuencia/duración de tomas, signos de ingesta adecuada, manejo de problemas comunes (dolor, ingurgitación).",
                    "Ayuda en la Lactancia Materna (NIC 1054): Asistir con el posicionamiento y el agarre al inicio. Fomentar contacto piel con piel.",
                    "Manejo del Dolor: Enseñar cuidado de pezones. Evaluar causa del dolor (mal agarre, anquiloglosia, infección).",
                    "Monitorización Nutricional del Lactante: Control de peso, pañales.",
                    "Apoyo Emocional (NIC 5270): Fomentar confianza materna. Abordar ansiedad.",
                    "Aumentar los Sistemas de Apoyo (NIC 5440): Informar sobre grupos de apoyo a la lactancia, consultoras de lactancia.",
                    "Manejo de la Ingurgitación: Extracción manual/bombeo, compresas frías/calientes."
                    ]
                },
                {
                    "id": "00111",
                    "label": "Retraso en el crecimiento y desarrollo",
                    "definicion": "Desviaciones de las normas para el grupo de edad en los hitos del desarrollo físico, social, emocional o cognitivo.",
                    "relacionadoCon": [
                    "Factores prenatales: Exposición a teratógenos, infecciones congénitas, malnutrición materna.",
                    "Factores perinatales: Prematuridad, bajo peso al nacer, hipoxia neonatal.",
                    "Factores postnatales:",
                    "  - Físicos: Enfermedad crónica, desnutrición, discapacidad física, deterioro sensorial (visión, audición).",
                    "  - Ambientales: Estimulación inadecuada, privación afectiva, pobreza, exposición a toxinas ambientales.",
                    "  - Psicosociales: Trastornos del apego, maltrato o negligencia, depresión materna, disfunción familiar.",
                    "Anomalías genéticas o congénitas."
                    ],
                    "manifestadoPor": [
                    "Retraso en alcanzar los hitos del desarrollo (motor grueso/fino, lenguaje, social, cognitivo) según escalas estandarizadas (Denver II, etc.).",
                    "Rendimiento por debajo del nivel de edad en pruebas de desarrollo.",
                    "Alteración del crecimiento físico (peso, talla, perímetro cefálico por debajo de percentiles esperados).",
                    "Pérdida de habilidades previamente adquiridas (regresión).",
                    "Apatía, falta de respuesta social, contacto visual pobre.",
                    "Irritabilidad.",
                    "Dificultades de alimentación."
                    ],
                    "resultadosEsperados": [
                    "El niño alcanzará los hitos del desarrollo apropiados para su edad o demostrará progreso hacia ellos. (NOC 0110 Crecimiento / NOC 0107 Desarrollo infantil: [especificar edad])",
                    "El niño alcanzará parámetros de crecimiento físico dentro de los límites normales.",
                    "La familia participará activamente en programas de estimulación y seguimiento.",
                    "La familia comprenderá las necesidades de desarrollo del niño y las estrategias para fomentarlo."
                    ],
                    "intervenciones": [
                    "Vigilancia del Desarrollo (NIC 6651 / usando escalas): Evaluar regularmente el desarrollo motor, del lenguaje, social y cognitivo.",
                    "Monitorización del Crecimiento Físico: Medir peso, talla, perímetro cefálico y comparar con curvas de crecimiento.",
                    "Fomento del Desarrollo Infantil (NIC 827x - especificar edad): Implementar actividades de estimulación apropiadas para la edad y el nivel de desarrollo.",
                    "Manejo de la Nutrición (NIC 1100): Asegurar ingesta nutricional adecuada para el crecimiento.",
                    "Apoyo Familiar (NIC 7140): Proporcionar apoyo emocional e información a la familia.",
                    "Enseñanza: Estimulación Infantil (NIC 5606 / similar): Educar a los padres sobre hitos del desarrollo y actividades para estimular a su hijo.",
                    "Derivación: Referir a servicios especializados (atención temprana, neurología pediátrica, logopedia, fisioterapia, servicios sociales) según necesidad.",
                    "Coordinación de Cuidados Interdisciplinares."
                    ]
                },
                {
                    "id": "00112",
                    "label": "Riesgo de retraso en el desarrollo",
                    "definicion": "Susceptible a sufrir un retraso del 25% o más en una o más de las áreas de conducta social o autorreguladora, cognitiva, del lenguaje o de las habilidades motoras gruesas o finas, que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Factores prenatales: Cuidado prenatal tardío/ausente, pobreza, enfermedad materna, abuso de sustancias materno.",
                    "Factores individuales: Prematuridad, bajo peso al nacer, enfermedad congénita/genética, alteración del crecimiento, enfermedad crónica, hospitalización frecuente, deterioro sensorial, exposición a tóxicos (plomo).",
                    "Factores ambientales: Pobreza, violencia doméstica, estimulación inadecuada.",
                    "Factores del cuidador: Enfermedad mental del cuidador, abuso/negligencia, nivel educativo bajo, embarazo adolescente, depresión materna."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El niño alcanzará los hitos del desarrollo dentro de los límites normales para su edad. (NOC 0107 Desarrollo infantil: [especificar edad])",
                    "La familia identificará factores de riesgo para el retraso.",
                    "La familia proporcionará un entorno estimulante y seguro para el desarrollo.",
                    "Se detectarán precozmente posibles desviaciones del desarrollo.",
                    "La familia accederá a recursos comunitarios de apoyo si es necesario."
                    ],
                    "intervenciones": [
                    "Vigilancia del Desarrollo (NIC 6651 / usando escalas): Realizar cribado del desarrollo en visitas de salud infantil.",
                    "Identificación de Riesgos (NIC 6610): Evaluar factores de riesgo prenatales, individuales, ambientales y del cuidador.",
                    "Enseñanza: Estimulación Infantil (NIC 5606 / similar): Educar a los padres sobre la importancia del juego, la lectura, la interacción verbal y un entorno seguro y estimulante.",
                    "Guías Anticipatorias (NIC 5210): Proporcionar información a los padres sobre los hitos del desarrollo esperados y cómo fomentarlos.",
                    "Fomento de la Vinculación Afectiva Padres-Hijo.",
                    "Apoyo Familiar (NIC 7140): Identificar necesidades de la familia y conectar con recursos (programas de visitas domiciliarias, servicios sociales, grupos de padres).",
                    "Monitorización Nutricional y del Crecimiento Físico.",
                    "Derivación Precoz: Referir a atención temprana si se detectan signos de riesgo o retraso leve."
                    ]
                },
                {
                    "id": "00118",
                    "label": "Trastorno de la imagen corporal",
                    "definicion": "Confusión en la imagen mental del yo físico.",
                    "relacionadoCon": [
                    "Causas biofísicas: Enfermedad crónica, traumatismo/lesión (amputación, quemaduras, cicatrices), cirugía (mastectomía, colostomía), obesidad, delgadez.",
                    "Causas cognitivas/perceptuales: Dolor crónico, alteración neurológica.",
                    "Causas psicosociales: Trastornos alimentarios, baja autoestima, influencias culturales/sociales, expectativas irreales.",
                    "Relacionado con el desarrollo: Cambios asociados a la edad (pubertad, envejecimiento).",
                    "Tratamientos: Efectos secundarios de medicación (p. ej., corticoides)."
                    ],
                    "manifestadoPor": [
                    "Verbalización de sentimientos negativos sobre el propio cuerpo (miedo al rechazo, vergüenza, impotencia).",
                    "Verbalización de cambios en el estilo de vida debido a la imagen corporal.",
                    "Ocultamiento o sobreexposición de una parte corporal.",
                    "Falta de cuidado de una parte corporal o preocupación excesiva por ella.",
                    "Expresión de sentimientos que reflejan una alteración de la visión del propio cuerpo (aspecto, estructura o función).",
                    "Evitación de mirar o tocar una parte corporal.",
                    "Falta de voluntad para hablar sobre el cambio corporal.",
                    "Énfasis en logros pasados o en la fuerza.",
                    "Comparación con otros.",
                    "Aislamiento social."
                    ],
                    "resultadosEsperados": [
                    "El paciente desarrollará una imagen corporal positiva y realista. (NOC 1200 Imagen corporal)",
                    "El paciente demostrará adaptación a los cambios en el aspecto físico o función corporal. (NOC 1300 Aceptación: estado de salud)",
                    "El paciente cuidará adecuadamente la parte corporal afectada.",
                    "El paciente participará en actividades sociales y de autocuidado.",
                    "El paciente verbalizará sentimientos sobre su imagen corporal y utilizará estrategias de afrontamiento."
                    ],
                    "intervenciones": [
                    "Mejora de la Imagen Corporal (NIC 5220): Ayudar al paciente a identificar percepciones y sentimientos sobre su cuerpo. Fomentar la verbalización.",
                    "Potenciación de la Autoestima (NIC 5400): Ayudar a identificar fortalezas no relacionadas con el aspecto físico. Reforzar aspectos positivos.",
                    "Apoyo Emocional (NIC 5270): Escuchar activamente, mostrar aceptación incondicional.",
                    "Aumentar el Afrontamiento (NIC 5230): Ayudar a desarrollar estrategias para manejar sentimientos negativos y adaptarse a los cambios.",
                    "Enseñanza: Proceso de Enfermedad/Adaptación (NIC 5602): Proporcionar información realista sobre el cambio corporal y el proceso de adaptación.",
                    "Fomento del Autocuidado: Animar al cuidado personal y arreglo (vestido, higiene) para mejorar la autoimagen.",
                    "Fomento de la Socialización (NIC 5100): Animar a mantener relaciones y participar en actividades.",
                    "Derivación: Considerar grupos de apoyo para personas con condiciones similares (ostomizados, amputados, etc.) o terapia psicológica."
                    ]
                },
                {
                    "id": "00119",
                    "label": "Baja autoestima crónica",
                    "definicion": "Autoevaluación negativa de larga duración o sentimientos negativos acerca de uno mismo o de las propias capacidades.",
                    "relacionadoCon": [
                    "Experiencias vitales tempranas negativas (falta de afecto, rechazo, abuso, críticas constantes).",
                    "Fracasos o pérdidas repetidas.",
                    "Expectativas irreales sobre uno mismo.",
                    "Pertenencia a un grupo estigmatizado.",
                    "Falta de reconocimiento o valoración por parte de otros.",
                    "Trastornos psiquiátricos (depresión).",
                    "Incongruencia entre el yo ideal y el yo real.",
                    "Refuerzo negativo repetido."
                    ],
                    "manifestadoPor": [
                    "Verbalizaciones autonegativas o autocríticas constantes.",
                    "Expresión de sentimientos de vergüenza, culpa o inutilidad.",
                    "Evaluación de sí mismo como incapaz de afrontar los eventos.",
                    "Racionalización o rechazo de los comentarios positivos sobre sí mismo.",
                    "Exageración de los comentarios negativos sobre sí mismo.",
                    "Indecisión, falta de asertividad.",
                    "Hipersensibilidad a la crítica.",
                    "Conductas de búsqueda de aprobación excesiva.",
                    "Aislamiento social, falta de contacto visual.",
                    "Pasividad.",
                    "Éxito frecuente en el trabajo o en otros aspectos de la vida (sobrecompensación)."
                    ],
                    "resultadosEsperados": [
                    "El paciente expresará una autoevaluación más positiva. (NOC 1205 Autoestima)",
                    "El paciente identificará y valorará sus propias fortalezas y logros.",
                    "El paciente disminuirá las verbalizaciones autonegativas.",
                    "El paciente demostrará mayor asertividad y participación en la toma de decisiones.",
                    "El paciente establecerá metas realistas para sí mismo."
                    ],
                    "intervenciones": [
                    "Potenciación de la Autoestima (NIC 5400): Ayudar al paciente a identificar y centrarse en sus puntos fuertes. Fomentar la autoafirmación positiva. Ayudar a establecer metas realistas y alcanzables.",
                    "Apoyo Emocional (NIC 5270): Mostrar aceptación incondicional. Fomentar la expresión de sentimientos.",
                    "Ayuda para Modificar el Autoconcepto (NIC 5330): Ayudar a reevaluar percepciones negativas sobre sí mismo. Desafiar pensamientos irracionales.",
                    "Entrenamiento en Asertividad (NIC 4340): Enseñar y practicar habilidades asertivas.",
                    "Establecimiento de Límites (NIC 4380): Ayudar a establecer límites apropiados en las relaciones.",
                    "Fomento de la Implicación Social (NIC 5100): Animar a participar en actividades donde pueda experimentar éxito y reconocimiento.",
                    "Identificación de Recursos: Conectar con grupos de apoyo o terapia psicológica si es necesario."
                    ]
                },
                {
                    "id": "00120",
                    "label": "Baja autoestima situacional",
                    "definicion": "Desarrollo de una percepción negativa de la propia valía en respuesta a una situación actual (especificar).",
                    "relacionadoCon": [
                    "Cambios en el rol social (pérdida de empleo, jubilación).",
                    "Alteración de la imagen corporal (cirugía, enfermedad, accidente).",
                    "Fracaso percibido en un evento vital (examen, relación).",
                    "Conducta inconsistente con los propios valores.",
                    "Falta de reconocimiento o valoración en una situación específica.",
                    "Antecedentes de baja autoestima crónica (puede ser un factor predisponente)."
                    ],
                    "manifestadoPor": [
                    "Verbalizaciones autonegativas en respuesta a la situación específica.",
                    "Expresión de sentimientos de inutilidad o vergüenza relacionados con la situación.",
                    "Evaluación de sí mismo como incapaz de manejar la situación.",
                    "Dificultad para tomar decisiones en el contexto situacional.",
                    "Retraimiento o vacilación en probar cosas nuevas relacionadas con la situación.",
                    "Puede coexistir con manifestaciones de baja autoestima crónica pero focalizadas en la situación."
                    ],
                    "resultadosEsperados": [
                    "El paciente recuperará una autoevaluación positiva en relación a la situación desencadenante. (NOC 1205 Autoestima)",
                    "El paciente identificará y utilizará fortalezas para afrontar la situación.",
                    "El paciente verbalizará una percepción realista de la situación y de sus capacidades.",
                    "El paciente tomará decisiones apropiadas respecto a la situación.",
                    "El paciente reanudará actividades o roles afectados por la situación."
                    ],
                    "intervenciones": [
                    "Potenciación de la Autoestima (NIC 5400): Centrarse en las fortalezas y capacidades del paciente para manejar la situación actual. Ayudar a reinterpretar la situación de forma más positiva/realista.",
                    "Apoyo Emocional (NIC 5270): Validar los sentimientos del paciente respecto a la situación. Ofrecer apoyo y escucha.",
                    "Aumentar el Afrontamiento (NIC 5230): Ayudar a identificar y desarrollar estrategias de afrontamiento específicas para la situación.",
                    "Apoyo en la Toma de Decisiones (NIC 5250): Ayudar a evaluar opciones y tomar decisiones relacionadas con la situación.",
                    "Enseñanza: Proceso de Enfermedad/Adaptación (NIC 5602): Si la situación es una enfermedad/cambio físico, proporcionar información para facilitar la adaptación.",
                    "Identificación de Recursos de Apoyo: Conectar con otros que hayan pasado por situaciones similares (grupos de apoyo).",
                    "Fomento de la Resiliencia (NIC 5410): Ayudar a identificar factores protectores y fomentar la capacidad de recuperación."
                    ]
                },
                {
                    "id": "00122",
                    "label": "Trastorno de la percepción sensorial (especificar: visual, auditiva, cinestésica, gustativa, táctil, olfativa)",
                    "definicion": "Cambio en la cantidad o patrón de los estímulos que ingresan, acompañado por una respuesta disminuida, exagerada, distorsionada o deteriorada a dichos estímulos.",
                    "relacionadoCon": [
                    "Alteración de la recepción sensorial (deterioro visual/auditivo, neuropatía periférica, alteración del gusto/olfato).",
                    "Alteración de la transmisión o integración sensorial (lesión cerebral, ACV, tumor, demencia, esclerosis múltiple).",
                    "Restricción ambiental o social (aislamiento, inmovilización, UCI).",
                    "Sobrecarga de estímulos (ruido/luz excesivos, dolor, estrés).",
                    "Deprivación de estímulos.",
                    "Desequilibrio químico (electrolitos, uremia, efectos de fármacos/drogas)."
                    ],
                    "manifestadoPor": [
                    "Cambios en la agudeza sensorial (visión borrosa, disminución audición, etc.).",
                    "Cambios en la respuesta a estímulos (hipo/hiperestesia, parestesias).",
                    "Desorientación en tiempo, espacio o personas.",
                    "Incapacidad para concentrarse, alteración de los patrones de comunicación.",
                    "Irritabilidad, agitación, inquietud.",
                    "Apatía, retraimiento.",
                    "Alteración de la capacidad para resolver problemas.",
                    "Distorsiones perceptivas (ilusiones, alucinaciones).",
                    "Cambios en los patrones de conducta.",
                    "Coordinación motora alterada."
                    ],
                    "resultadosEsperados": [
                    "El paciente mantendrá un contacto adecuado con la realidad. (NOC 0901 Orientación cognitiva)",
                    "El paciente compensará el déficit sensorial utilizando otros sentidos o ayudas. (NOC 1610 Conducta de compensación sensorial)",
                    "El paciente permanecerá libre de lesiones relacionadas con el déficit sensorial.",
                    "El paciente interpretará correctamente los estímulos ambientales.",
                    "El paciente comunicará sus necesidades eficazmente."
                    ],
                    "intervenciones": [
                    "Manejo de la Sensopercepción (NIC - especificar tipo: visual, auditiva, etc.): Evaluar el déficit específico. Orientar frecuentemente. Mantener un entorno seguro y predecible.",
                    "Comunicación: Mejorar la Comunicación (NIC 4976 - especificar déficit): Hablar claro, usar ayudas visuales/auditivas, validar percepciones.",
                    "Manejo Ambiental (NIC 6480): Reducir estímulos innecesarios (si hay sobrecarga) o proporcionar estímulos adecuados (si hay deprivación). Buena iluminación. Reducir ruido.",
                    "Estimulación Cognitiva (NIC 4720): Actividades para mantener la orientación y función cognitiva.",
                    "Manejo de las Alucinaciones/Ilusiones (NIC 6510): No reforzar las percepciones erróneas, pero validar los sentimientos asociados. Reorientar a la realidad.",
                    "Prevención de Lesiones: Asegurar entorno libre de peligros (especialmente si hay déficit visual o táctil).",
                    "Fomento del Autocuidado: Animar a usar gafas/audífonos. Asistir según necesidad.",
                    "Apoyo Emocional (NIC 5270): Reducir ansiedad asociada a las alteraciones perceptivas."
                    ]
                },
                {
                    "id": "00124",
                    "label": "Desesperanza",
                    "definicion": "Estado subjetivo en que la persona percibe pocas o ninguna alternativa o elecciones personales y es incapaz de movilizar la energía en su propio provecho.",
                    "relacionadoCon": [
                    "Abandono o aislamiento social prolongado.",
                    "Pérdida de la fe en un poder superior o en valores trascendentes.",
                    "Deterioro del estado fisiológico (enfermedad crónica/terminal, dolor crónico, limitación funcional).",
                    "Estrés de larga duración.",
                    "Pérdidas repetidas.",
                    "Restricción prolongada de la actividad.",
                    "Falta de control percibido sobre la situación."
                    ],
                    "manifestadoPor": [
                    "Verbalizaciones de desesperanza (p. ej., nada puede cambiar", "no vale la pena",
                    "Disminución del afecto, apatía.",
                    "Disminución de la iniciativa, pasividad.",
                    "Disminución de la respuesta a estímulos.",
                    "Falta de implicación en los cuidados.",
                    "Cierre de los ojos, falta de contacto visual.",
                    "Encogerse de hombros en respuesta al interlocutor.",
                    "Disminución del apetito, trastornos del sueño.",
                    "Verbalización de sentimientos de vacío.",
                    "Suspiros."
                    ],
                    "resultadosEsperados": [
                    "El paciente expresará sentimientos de esperanza y un sentido de propósito o significado. (NOC 1201 Esperanza)",
                    "El paciente identificará metas personales realistas y alcanzables.",
                    "El paciente participará en actividades de autocuidado y toma de decisiones.",
                    "El paciente verbalizará sentimientos y buscará apoyo.",
                    "El paciente identificará sus propias fortalezas y recursos."
                    ],
                    "intervenciones": [
                    "Inspirar Esperanza (NIC 5310): Ayudar al paciente a identificar áreas de esperanza en su vida. Fomentar la revisión de logros pasados y fortalezas. Evitar \"falsas esperanzas\" pero mantener una actitud positiva realista.",
                    "Apoyo Emocional (NIC 5270): Crear un ambiente de aceptación. Fomentar la expresión de sentimientos (tristeza, ira, desesperanza).",
                    "Apoyo Espiritual (NIC 5420): Explorar fuentes de significado y esperanza (religiosas o no). Facilitar contacto con recursos espirituales si lo desea.",
                    "Aumentar el Afrontamiento (NIC 5230): Ayudar a identificar estrategias de afrontamiento y áreas de control personal.",
                    "Establecimiento de Metas Comunes (NIC 4410): Ayudar a fijar metas pequeñas y alcanzables para fomentar sensación de logro.",
                    "Fomento de la Autoestima (NIC 5400): Reforzar el valor intrínseco del paciente.",
                    "Fomento de la Implicación Familiar/Social (NIC 7110 / 5100): Animar a mantener conexiones sociales.",
                    "Presencia (NIC 5340): Pasar tiempo con el paciente, mostrando interés."
                    ]
                },
                {
                    "id": "00125",
                    "label": "Impotencia",
                    "definicion": "Percepción de que las propias acciones no afectarán significativamente a un resultado; falta percibida de control sobre una situación actual o un acontecimiento inmediato.",
                    "relacionadoCon": [
                    "Entorno de cuidados de salud (pérdida de control sobre rutinas, privacidad, decisiones).",
                    "Régimen terapéutico complejo o restrictivo.",
                    "Enfermedad incapacitante o progresiva.",
                    "Falta de conocimientos sobre la enfermedad o tratamiento.",
                    "Patrón de interacción interpersonal de impotencia aprendida.",
                    "Falta de recursos (económicos, sociales).",
                    "Creencias sobre salud (locus de control externo)."
                    ],
                    "manifestadoPor": [
                    "Verbalización de falta de control sobre la situación o el resultado.",
                    "Expresión de dudas sobre el desempeño del rol.",
                    "Pasividad, apatía, no participación en los cuidados o toma de decisiones.",
                    "Expresión de insatisfacción o frustración por la incapacidad para realizar tareas/actividades previas.",
                    "Dependencia de otros que puede resultar en irritabilidad, resentimiento, ira.",
                    "Síntomas de depresión (tristeza, falta de apetito, insomnio).",
                    "Ansiedad."
                    ],
                    "resultadosEsperados": [
                    "El paciente participará activamente en la planificación y ejecución de su cuidado. (NOC 1609 Conducta de cumplimiento / NOC 1606 Participación en las decisiones sobre la salud)",
                    "El paciente identificará áreas sobre las que tiene control.",
                    "El paciente tomará decisiones relacionadas con su cuidado cuando sea posible.",
                    "El paciente expresará sentimientos de control sobre la situación.",
                    "El paciente disminuirá los sentimientos de frustración o apatía."
                    ],
                    "intervenciones": [
                    "Fomento de la Autonomía/Autorresponsabilidad (NIC 4480): Fomentar la máxima independencia en el autocuidado. Implicar al paciente en la toma de decisiones, ofreciendo opciones siempre que sea posible.",
                    "Apoyo en la Toma de Decisiones (NIC 5250): Proporcionar información clara y completa. Ayudar a clarificar opciones y consecuencias.",
                    "Mejora del Autocontrol (NIC 5395 / similar a Aumentar el Afrontamiento NIC 5230): Ayudar a identificar factores que puede controlar. Fomentar el establecimiento de metas realistas.",
                    "Escucha Activa (NIC 4920): Permitir la expresión de sentimientos de frustración o falta de control.",
                    "Enseñanza: Proceso de Enfermedad/Tratamiento (NIC 5602 / 5618): Proporcionar conocimientos para aumentar la sensación de control.",
                    "Potenciación de la Autoestima (NIC 5400): Reforzar las decisiones y acciones del paciente.",
                    "Acuerdo con el Paciente (NIC 4420): Negociar y pactar aspectos del plan de cuidados.",
                    "Apoyo Emocional (NIC 5270)."
                    ]
                },
                {
                    "id": "00131",
                    "label": "Deterioro de la memoria",
                    "definicion": "Incapacidad para recordar o recuperar parcelas de información o habilidades conductuales.",
                    "relacionadoCon": [
                    "Alteración neurológica (demencia, Alzheimer, lesión cerebral, ACV, tumores).",
                    "Anemia, hipoxia.",
                    "Desequilibrio de líquidos y electrólitos.",
                    "Trastornos metabólicos.",
                    "Privación de sueño.",
                    "Sobrecarga de información o estímulos ambientales.",
                    "Estrés excesivo, ansiedad, depresión.",
                    "Efectos de medicación (sedantes, anestésicos).",
                    "Abuso de sustancias.",
                    "Envejecimiento."
                    ],
                    "manifestadoPor": [
                    "Olvido de información reciente o remota.",
                    "Incapacidad para recordar hechos, eventos o personas.",
                    "Incapacidad para aprender o retener nueva información.",
                    "Incapacidad para determinar si una conducta se ha realizado.",
                    "Olvido de realizar una conducta en el momento programado.",
                    "Pérdida de orientación.",
                    "Dificultad para recordar nombres o palabras.",
                    "Confabulación (invención de recuerdos para rellenar lagunas)."
                    ],
                    "resultadosEsperados": [
                    "El paciente utilizará estrategias para compensar el déficit de memoria. (NOC 0908 Memoria)",
                    "El paciente mantendrá un nivel óptimo de funcionamiento cognitivo dentro de sus limitaciones.",
                    "El paciente permanecerá orientado en la medida de lo posible.",
                    "El paciente mantendrá la seguridad personal.",
                    "La familia comprenderá el déficit de memoria y las estrategias de manejo."
                    ],
                    "intervenciones": [
                    "Entrenamiento de la Memoria (NIC 4760): Utilizar ayudas externas (calendarios, notas, alarmas, listas, pastilleros). Fomentar el uso de agendas.",
                    "Estimulación Cognitiva (NIC 4720): Realizar ejercicios de memoria (asociación, categorización). Utilizar terapia de reminiscencia.",
                    "Orientación de la Realidad (NIC 4820): Reorientar frecuentemente. Mantener rutinas consistentes.",
                    "Manejo Ambiental (NIC 6480): Proporcionar un entorno estructurado y familiar. Reducir distracciones.",
                    "Vigilancia: Seguridad (NIC 6654): Asegurar entorno seguro para prevenir accidentes debidos a olvidos.",
                    "Comunicación: Usar instrucciones claras y sencillas. Repetir información si es necesario. Dar tiempo para procesar.",
                    "Apoyo Familiar (NIC 7140): Educar a la familia sobre el manejo del déficit de memoria y estrategias de comunicación.",
                    "Manejo de la Demencia (NIC 6460): Si la causa es demencia, aplicar intervenciones específicas."
                    ]
                },
                {
                    "id": "00135",
                    "label": "Duelo disfuncional",
                    "definicion": "Trastorno que ocurre tras la muerte de una persona significativa (o pérdida significativa), en el que la experiencia del sufrimiento no sigue las expectativas normativas y se manifiesta en un deterioro funcional. (Nota: NANDA-I usa Duelo complicado 00136).",
                    "relacionadoCon": [
                    "Pérdida de persona(s) significativa(s) o de objeto(s) valorado(s) (salud, empleo, hogar).",
                    "Muerte súbita o inesperada.",
                    "Muerte violenta o traumática.",
                    "Relación ambivalente o dependiente con el fallecido/perdido.",
                    "Falta de apoyo social.",
                    "Múltiples pérdidas en corto tiempo.",
                    "Historia de trauma o pérdidas no resueltas.",
                    "Incapacidad para expresar el duelo (restricciones culturales/sociales).",
                    "Factores de personalidad (baja autoestima, dificultad para afrontar)."
                    ],
                    "manifestadoPor": [
                    "Expresión de angustia persistente por la pérdida.",
                    "Rumiación sobre la pérdida, preocupación excesiva por el fallecido/perdido.",
                    "Negación de la pérdida, evitación de recordatorios.",
                    "Sentimientos intensos y prolongados de culpa, ira, amargura, depresión, vacío.",
                    "Aislamiento social significativo.",
                    "Deterioro funcional importante (laboral, social, autocuidado).",
                    "Búsqueda excesiva del fallecido, dificultad para imaginar un futuro sin él/ella.",
                    "Síntomas somáticos sin causa orgánica.",
                    "Ideación suicida (en casos severos).",
                    "Abuso de sustancias como forma de afrontamiento."
                    ],
                    "resultadosEsperados": [
                    "El paciente progresará a través de las etapas del duelo hacia la resolución. (NOC 1304 Resolución de la aflicción)",
                    "El paciente expresará sentimientos relacionados con la pérdida de forma adaptativa.",
                    "El paciente reanudará gradualmente las actividades sociales y roles habituales.",
                    "El paciente encontrará significado en la pérdida y podrá recordar al fallecido/perdido sin angustia abrumadora.",
                    "El paciente mantendrá la esperanza y planificará el futuro."
                    ],
                    "intervenciones": [
                    "Facilitación del Duelo (NIC 5290): Fomentar la expresión de sentimientos. Normalizar las reacciones de duelo. Ayudar a identificar y recordar aspectos positivos y negativos de la relación/situación perdida.",
                    "Apoyo Emocional (NIC 5270): Escuchar activamente. Mostrar empatía y aceptación.",
                    "Aumentar el Afrontamiento (NIC 5230): Ayudar a identificar estrategias de afrontamiento adaptativas. Fomentar el autocuidado.",
                    "Apoyo Espiritual (NIC 5420): Explorar significado de la pérdida, creencias sobre muerte/vida.",
                    "Fomento de la Implicación Social (NIC 5100): Animar a buscar apoyo en familia, amigos o grupos de duelo.",
                    "Identificación de Riesgos: Evaluar riesgo de depresión severa o suicidio.",
                    "Terapia de Reminiscencia (NIC 4860): Ayudar a recordar y procesar memorias.",
                    "Derivación: Referir a terapia especializada en duelo o salud mental si el duelo es muy complicado o prolongado."
                    ]
                },
                {
                    "id": "00140",
                    "label": "Riesgo de violencia autodirigida",
                    "definicion": "Susceptible de realizar conductas que pueden ser física, emocional y/o sexualmente lesivas para uno mismo.",
                    "relacionadoCon": [
                    "Trastornos psiquiátricos (depresión mayor, trastorno bipolar, esquizofrenia, trastorno límite de la personalidad, trastorno de estrés postraumático, trastornos alimentarios).",
                    "Abuso de sustancias.",
                    "Antecedentes de intentos de suicidio o autolesiones.",
                    "Historia de abuso (físico, sexual, emocional) o trauma.",
                    "Aislamiento social, falta de apoyo.",
                    "Crisis vitales (pérdidas, fracasos, problemas legales/financieros).",
                    "Impulsividad, desesperanza, baja autoestima.",
                    "Dolor crónico o enfermedad terminal.",
                    "Conflictos interpersonales.",
                    "Disponibilidad de medios letales."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente no se infligirá daño a sí mismo. (NOC 1408 Autocontrol de los impulsos nocivos)",
                    "El paciente expresará sentimientos de angustia y buscará ayuda.",
                    "El paciente identificará factores desencadenantes y estrategias de afrontamiento alternativas a la autolesión.",
                    "El paciente establecerá un plan de seguridad con el personal.",
                    "El paciente mantendrá la esperanza y conexión social."
                    ],
                    "intervenciones": [
                    "Manejo de la Conducta: Autolesión (NIC 4354): Evaluar riesgo inmediato (ideación, plan, medios). Establecer contrato de no autolesión (con limitaciones).",
                    "Vigilancia: Seguridad (NIC 6654): Proporcionar entorno seguro (retirar objetos peligrosos). Observación estrecha o continua según nivel de riesgo.",
                    "Prevención del Suicidio (NIC 6340): Tomar en serio cualquier amenaza o ideación. Mantener comunicación abierta sobre pensamientos de daño. Explorar alternativas.",
                    "Apoyo Emocional (NIC 5270): Establecer relación terapéutica de confianza. Escuchar sin juzgar.",
                    "Aumentar el Afrontamiento (NIC 5230): Enseñar estrategias para manejar impulsos y emociones intensas (técnicas de distracción, relajación, resolución de problemas).",
                    "Inspirar Esperanza (NIC 5310): Ayudar a encontrar razones para vivir.",
                    "Manejo de la Medicación (NIC 2380): Asegurar toma de medicación psiquiátrica prescrita.",
                    "Implicación Familiar (NIC 7110): Involucrar a la familia en el plan de seguridad y apoyo (con consentimiento).",
                    "Derivación Urgente: A servicios de salud mental si no está ya en tratamiento."
                    ]
                },
                {
                    "id": "00150",
                    "label": "Riesgo de suicidio",
                    "definicion": "Susceptible de autoinfligirse una lesión que ponga en peligro la vida.",
                    "relacionadoCon": [
                    "Trastornos del estado de ánimo (depresión mayor, trastorno bipolar).",
                    "Trastornos psicóticos (esquizofrenia).",
                    "Trastornos de ansiedad.",
                    "Trastornos de la personalidad (límite, antisocial).",
                    "Abuso de sustancias (alcohol, drogas).",
                    "Antecedentes personales de intentos de suicidio.",
                    "Antecedentes familiares de suicidio o trastornos mentales.",
                    "Enfermedad física crónica/terminal, dolor crónico.",
                    "Pérdidas recientes o significativas (duelo, divorcio, empleo).",
                    "Aislamiento social, falta de pertenencia.",
                    "Desesperanza intensa.",
                    "Impulsividad, agresividad.",
                    "Acceso a medios letales (armas de fuego, medicamentos).",
                    "Crisis vitales, trauma."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente no intentará suicidarse. (NOC 1409 Autocontrol del impulso suicida)",
                    "El paciente permanecerá seguro en el entorno.",
                    "El paciente expresará pensamientos y sentimientos suicidas al personal.",
                    "El paciente identificará razones para vivir y fuentes de esperanza.",
                    "El paciente desarrollará y utilizará un plan de seguridad.",
                    "El paciente aceptará y participará en el tratamiento."
                    ],
                    "intervenciones": [
                    "Prevención del Suicidio (NIC 6340): ¡PRIORIDAD ABSOLUTA! Evaluar directamente la ideación, plan, intención y acceso a medios. Determinar nivel de riesgo.",
                    "Vigilancia: Seguridad (NIC 6654): Entorno seguro (retirada de objetos peligrosos). Observación continua o muy frecuente (1:1 si es necesario).",
                    "Contrato de Seguridad/Plan de Seguridad: Desarrollar un plan con el paciente sobre qué hacer si surgen impulsos suicidas (contactar personal, usar estrategias de afrontamiento, llamar a línea de crisis).",
                    "Establecimiento de Límites (NIC 4380): Comunicación clara sobre expectativas de seguridad.",
                    "Manejo de la Conducta: Autolesión (NIC 4354).",
                    "Apoyo Emocional (NIC 5270): Escucha activa, validación de sentimientos, transmitir preocupación y esperanza.",
                    "Inspirar Esperanza (NIC 5310).",
                    "Aumentar el Afrontamiento (NIC 5230): Enseñar manejo de crisis, resolución de problemas.",
                    "Manejo de la Medicación (NIC 2380): Asegurar adherencia a tratamiento psiquiátrico.",
                    "Implicación Familiar (NIC 7110): Involucrar a la familia en plan de seguridad (con consentimiento).",
                    "Coordinación Urgente: Con equipo de salud mental (psiquiatra, psicólogo)."
                    ]
                },
                {
                    "id": "00152",
                    "label": "Riesgo de impotencia",
                    "definicion": "Susceptible a la percepción de que las propias acciones no afectarán significativamente un resultado, que puede comprometer la salud.",
                    "relacionadoCon": [
                    "Enfermedad o tratamiento que genera dependencia (hospitalización, inmovilización).",
                    "Falta de control sobre el entorno o las decisiones.",
                    "Pérdida de autonomía.",
                    "Falta de conocimientos sobre la situación o el plan de cuidados.",
                    "Barreras de comunicación.",
                    "Estilo de afrontamiento pasivo.",
                    "Expectativas poco realistas del personal de salud o la familia.",
                    "Falta de participación en la planificación de los cuidados.",
                    "Experiencias previas de falta de control."
                    ],
                    "manifestadoPor": [],
                    "resultadosEsperados": [
                    "El paciente expresará sentimientos de control sobre su situación actual. (NOC 1704 Creencias sobre la salud: control percibido)",
                    "El paciente participará activamente en la toma de decisiones sobre su cuidado.",
                    "El paciente identificará aspectos de la situación sobre los que puede ejercer control.",
                    "El paciente no desarrollará sentimientos de apatía o pasividad.",
                    "El paciente utilizará recursos disponibles para aumentar su control."
                    ],
                    "intervenciones": [
                    "Fomento de la Autonomía/Autorresponsabilidad (NIC 4480): Fomentar la participación activa en el cuidado y la toma de decisiones. Ofrecer opciones realistas.",
                    "Apoyo en la Toma de Decisiones (NIC 5250): Proporcionar información clara y comprensible. Ayudar a evaluar alternativas.",
                    "Mejora del Autocontrol (NIC 5395 / similar a Aumentar el Afrontamiento NIC 5230): Ayudar a identificar áreas de control personal. Reforzar esfuerzos.",
                    "Acuerdo con el Paciente (NIC 4420): Establecer metas y planes de cuidado de forma conjunta.",
                    "Enseñanza: Proceso de Enfermedad/Tratamiento (NIC 5602 / 5618): Aumentar conocimientos para empoderar al paciente.",
                    "Escucha Activa (NIC 4920): Validar sentimientos de falta de control.",
                    "Manejo Ambiental: Controlar el entorno para maximizar la independencia y las opciones del paciente.",
                    "Potenciación de la Autoestima (NIC 5400): Reforzar capacidades y decisiones."
                    ]
                },
                {
                    "id": "00168",
                    "label": "Sedentarismo",
                    "definicion": "Hábito de vida que se caracteriza por un bajo nivel de actividad física.",
                    "relacionadoCon": [
                    "Conocimientos deficientes sobre los beneficios para la salud de la actividad física.",
                    "Falta de interés o motivación.",
                    "Falta de recursos (tiempo, dinero, instalaciones seguras, apoyo social).",
                    "Limitaciones físicas (dolor, fatiga, discapacidad).",
                    "Factores psicológicos (depresión, ansiedad, baja autoeficacia).",
                    "Hábito.",
                    "Cultura o entorno que no fomenta la actividad."
                    ],
                    "manifestadoPor": [
                    "Elección de una rutina diaria con bajo nivel de actividad física.",
                    "Verbalización de preferencia por actividades de baja actividad física.",
                    "Condición física deficiente (baja resistencia, fuerza).",
                    "Sobrepeso u obesidad (frecuentemente asociado)."
                    ],
                    "resultadosEsperados": [
                    "El paciente participará en un nivel de actividad física recomendado para su edad y condición. (NOC 1633 Participación en el ejercicio)",
                    "El paciente verbalizará los beneficios de la actividad física regular.",
                    "El paciente identificará y superará barreras personales para la actividad física.",
                    "El paciente establecerá metas realistas de actividad física.",
                    "El paciente mostrará mejora en la condición física (si es medible)."
                    ],
                    "intervenciones": [
                    "Fomento del Ejercicio (NIC 0200): Evaluar nivel actual de actividad, preferencias y barreras. Ayudar a establecer metas realistas y un plan gradual.",
                    "Asesoramiento Nutricional (NIC 5246): Puede ser relevante si el sedentarismo se asocia a sobrepeso.",
                    "Enseñanza: Actividad/Ejercicio Prescrito (NIC 5612): Educar sobre beneficios, tipos de ejercicio adecuados, recomendaciones de frecuencia/intensidad/duración.",
                    "Modificación de la Conducta (NIC 4360): Ayudar a identificar desencadenantes del sedentarismo y a desarrollar estrategias para incorporar actividad en la rutina diaria.",
                    "Aumentar el Afrontamiento (NIC 5230): Si hay barreras psicológicas (falta de motivación, depresión).",
                    "Apoyo Social (NIC 5440): Fomentar búsqueda de compañeros de ejercicio o participación en grupos.",
                    "Manejo de la Energía (NIC 0180): Si la fatiga es una barrera."
                    ]
                },
                {
                    "id": "00177",
                    "label": "Estrés por sobrecarga",
                    "definicion": "Cantidad excesiva de estrés percibido que excede la capacidad de la persona para gestionarlo eficazmente.",
                    "relacionadoCon": [
                    "Agentes estresantes intensos o múltiples concurrentes (problemas financieros, laborales, familiares, de salud).",
                    "Recursos inadecuados (personales, sociales, económicos).",
                    "Nivel de percepción de control bajo.",
                    "Demandas excesivas.",
                    "Afrontamiento ineficaz.",
                    "Eventos vitales mayores acumulados."
                    ],
                    "manifestadoPor": [
                    "Expresión de sentirse abrumado, tenso o bajo presión.",
                    "Dificultad para tomar decisiones.",
                    "Aumento de la impaciencia, irritabilidad, ira o ansiedad.",
                    "Sensación de tensión.",
                    "Aumento de la conciencia de los estímulos ambientales.",
                    "Informes de problemas físicos (cefalea, dolor muscular, fatiga, problemas digestivos, trastornos del sueño).",
                    "Dificultad para concentrarse.",
                    "Aumento de la percepción de falta de control.",
                    "Funcionamiento deteriorado (laboral, social)."
                    ],
                    "resultadosEsperados": [
                    "El paciente identificará los factores estresantes y sus respuestas al estrés. (NOC 1302 Afrontamiento de problemas)",
                    "El paciente utilizará estrategias de afrontamiento efectivas para manejar el estrés. (NOC 1402 Autocontrol de la ansiedad / NOC 1405 Autocontrol de los impulsos)",
                    "El paciente referirá una disminución en la sensación de sobrecarga y tensión.",
                    "El paciente mantendrá un funcionamiento adecuado en sus roles.",
                    "El paciente utilizará recursos de apoyo."
                    ],
                    "intervenciones": [
                    "Aumentar el Afrontamiento (NIC 5230): Ayudar a identificar estresores y evaluar respuestas. Enseñar y practicar estrategias de manejo del estrés (resolución de problemas, gestión del tiempo, técnicas de relajación).",
                    "Apoyo Emocional (NIC 5270): Fomentar la expresión de sentimientos. Validar la experiencia del estrés.",
                    "Técnicas de Relajación (NIC 5880): Respiración profunda, meditación, visualización.",
                    "Asesoramiento (NIC 5240): Ayudar a reevaluar percepciones y expectativas.",
                    "Entrenamiento en Asertividad (NIC 4340): Si el estrés se relaciona con dificultad para decir \"no\" o establecer límites.",
                    "Manejo de la Energía (NIC 0180): Ayudar a priorizar tareas y equilibrar demandas.",
                    "Fomento del Ejercicio (NIC 0200): El ejercicio regular puede ayudar a reducir el estrés.",
                    "Aumentar los Sistemas de Apoyo (NIC 5440): Identificar y movilizar apoyo social."
                    ]
                },
                {
                    "id": "00214",
                    "label": "Disconfort",
                    "definicion": "Percepción de falta de tranquilidad, alivio y trascendencia en las dimensiones física, psicoespiritual, ambiental, cultural y/o social.",
                    "relacionadoCon": [
                    "Síntomas relacionados con la enfermedad (dolor, náuseas, prurito, disnea, espasmos musculares).",
                    "Tratamiento relacionado con efectos secundarios.",
                    "Recursos insuficientes (económicos, sociales, de conocimiento).",
                    "Control ambiental inadecuado (temperatura, ruido, luz, olores desagradables).",
                    "Privacidad insuficiente.",
                    "Situación de enfermedad o tratamiento.",
                    "Ansiedad, miedo.",
                    "Incapacidad para relajarse.",
                    "Estímulos ambientales irritantes."
                    ],
                    "manifestadoPor": [
                    "Informe verbal de sentirse incómodo.",
                    "Observación de signos de malestar (inquietud, gemidos, llanto, irritabilidad).",
                    "Alteración del patrón de sueño.",
                    "Incapacidad para relajarse.",
                    "Síntomas de angustia (frecuencia cardíaca/respiratoria aumentada, diaforesis).",
                    "Expresión facial de malestar (ceño fruncido, muecas).",
                    "Prurito.",
                    "Ansiedad."
                    ],
                    "resultadosEsperados": [
                    "El paciente expresará una sensación de confort físico y psicológico. (NOC 2100 Nivel de comodidad / NOC 2109 Nivel de malestar)",
                    "El paciente identificará factores que contribuyen al disconfort.",
                    "El paciente utilizará medidas para aumentar el confort.",
                    "El paciente mostrará signos de relajación (disminución de tensión muscular, expresión facial tranquila).",
                    "El paciente mantendrá un patrón de sueño adecuado."
                    ],
                    "intervenciones": [
                    "Manejo del Dolor (NIC 1400) / Manejo de las Náuseas (NIC 1450) / Manejo del Prurito (NIC 3550): Tratar síntomas físicos específicos que causan disconfort.",
                    "Manejo Ambiental: Confort (NIC 6482): Ajustar temperatura, luz, ruido. Proporcionar ropa de cama limpia y cómoda. Asegurar privacidad.",
                    "Posicionamiento: Confort (NIC 0840): Utilizar almohadas y soportes para mantener una posición cómoda.",
                    "Técnicas de Relajación (NIC 5880): Masaje, música suave, respiración profunda.",
                    "Manejo de la Energía (NIC 0180): Equilibrar actividad y reposo.",
                    "Apoyo Emocional (NIC 5270): Escuchar preocupaciones. Proporcionar tranquilidad.",
                    "Administración de Medicación: Analgésicos, antieméticos, antipruriginosos, sedantes leves según prescripción.",
                    "Simple Presencia / Tacto Terapéutico (NIC 5340 / 5465): Ofrecer confort a través de la presencia y el contacto físico apropiado."
                    ]
                },
                {
                    "id": "00255",
                    "label": "Síndrome de dolor crónico",
                    "definicion": "Dolor recurrente o persistente que ha durado al menos 3 meses y que afecta significativamente al funcionamiento diario y al bienestar.",
                    "relacionadoCon": [
                    "Lesión nerviosa o disfunción (neuropatía).",
                    "Enfermedad crónica (artritis, fibromialgia, cáncer, enfermedad inflamatoria intestinal).",
                    "Lesión musculoesquelética crónica.",
                    "Factores psicológicos (depresión, ansiedad, catastrofización del dolor, afrontamiento ineficaz).",
                    "Alteración del patrón de sueño.",
                    "Abuso físico o psicológico previo.",
                    "Creencias culturales sobre el dolor."
                    ],
                    "manifestadoPor": [
                    "Informe verbal de dolor persistente (>3 meses).",
                    "Alteración de la capacidad para continuar con las actividades previas (trabajo, ocio, social).",
                    "Fatiga.",
                    "Trastornos del sueño (insomnio, despertares frecuentes).",
                    "Cambios en el apetito.",
                    "Irritabilidad, frustración, depresión, ansiedad.",
                    "Aislamiento social.",
                    "Disminución de la movilidad física.",
                    "Atención centrada en el dolor.",
                    "Dependencia de analgésicos.",
                    "Miedo al movimiento o a volver a lesionarse (kinesiofobia)."
                    ],
                    "resultadosEsperados": [
                    "El paciente manejará el dolor crónico para mejorar su calidad de vida y funcionamiento. (NOC 1605 Control del dolor / NOC 2102 Nivel del dolor)",
                    "El paciente utilizará múltiples estrategias (farmacológicas y no farmacológicas) para el manejo del dolor.",
                    "El paciente mantendrá o mejorará su nivel de actividad física y participación social.",
                    "El paciente demostrará estrategias de afrontamiento adaptativas.",
                    "El paciente referirá una mejora en el patrón de sueño y nivel de energía.",
                    "El paciente expresará un mayor sentido de control sobre el dolor."
                    ],
                    "intervenciones": [
                    "Manejo del Dolor: Crónico (NIC 1400 / específico): Evaluar exhaustivamente el dolor y su impacto multidimensional. Establecer metas realistas con el paciente.",
                    "Administración de Analgesia: Utilizar enfoque multimodal (AINEs, opioides con precaución, adyuvantes como antidepresivos/anticonvulsivantes). Pauta fija y rescates. Educar sobre uso seguro.",
                    "Terapias No Farmacológicas: TENS, aplicación de calor/frío, masaje, acupuntura/acupresión, terapia física (ejercicio adaptado, estiramientos), técnicas de relajación, mindfulness, terapia cognitivo-conductual (TCC).",
                    "Manejo de la Energía (NIC 0180): Ayudar a equilibrar actividad y descanso. Combatir ciclo dolor-fatiga-inactividad.",
                    "Mejorar el Sueño (NIC 1850).",
                    "Aumentar el Afrontamiento (NIC 5230): Fomentar estrategias activas. Abordar catastrofización y miedo.",
                    "Apoyo Emocional (NIC 5270): Validar la experiencia del dolor. Abordar depresión/ansiedad.",
                    "Educación al Paciente/Familia: Sobre naturaleza del dolor crónico, plan de tratamiento, automanejo.",
                    "Derivación: Unidad del Dolor, fisioterapia, terapia ocupacional, salud mental, grupos de apoyo."
                    ]
                },
                {
                "id": "00001",
                "label": "Desequilibrio nutricional: ingesta superior a las necesidades",
                "definicion": "Aporte de nutrientes que excede las necesidades metabólicas.",
                "relacionadoCon": [
                    "Aporte excesivo en relación con las necesidades metabólicas.",
                    "Estilo de vida sedentario.",
                    "Conocimientos deficientes sobre el valor nutricional de los alimentos.",
                    "Patrones alimentarios disfuncionales (comer en respuesta a estímulos externos/internos distintos del hambre, como ansiedad o aburrimiento).",
                    "Factores culturales o económicos que influyen en la selección de alimentos.",
                    "Uso de ciertos medicamentos (corticoides, antidepresivos).",
                    "Disminución de la tasa metabólica."
                ],
                "manifestadoPor": [
                    "Peso corporal superior en un 10-20% al ideal para la talla y complexión.",
                    "Índice de Masa Corporal (IMC) superior a 25 kg/m² (sobrepeso) o ≥ 30 kg/m² (obesidad).",
                    "Pliegues cutáneos (tríceps, subescapular) superiores a la norma.",
                    "Ingesta diaria referida/observada superior a las necesidades recomendadas.",
                    "Concentrar la toma de alimentos al final del día.",
                    "Referencia u observación de patrones alimentarios disfuncionales.",
                    "Nivel de actividad física inferior al recomendado."
                ],
                "resultadosEsperados": [
                    "El paciente alcanzará y/o mantendrá un peso corporal saludable (IMC < 25). (NOC 1006 Peso: masa corporal)",
                    "El paciente equilibrará la ingesta calórica con el gasto energético. (NOC 1004 Estado nutricional)",
                    "El paciente describirá la relación entre ingesta, ejercicio y peso. (NOC 1802 Conocimiento: dieta)",
                    "El paciente modificará sus hábitos alimentarios (elección de alimentos, tamaño de porciones). (NOC 1622 Conducta de cumplimiento: dieta prescrita)",
                    "El paciente aumentará su nivel de actividad física. (NOC 1633 Participación en el ejercicio)"
                ],
                "intervenciones": [
                    "Manejo del Peso (NIC 1260): Determinar peso ideal y nivel de motivación para perder peso. Establecer metas realistas con el paciente.",
                    "Asesoramiento Nutricional (NIC 5246): Ayudar a identificar patrones alimentarios. Educar sobre necesidades calóricas, valor nutricional, lectura de etiquetas, control de porciones.",
                    "Enseñanza: Dieta Prescrita (NIC 5614): Facilitar la comprensión de un plan de alimentación saludable.",
                    "Fomento del Ejercicio (NIC 0200): Ayudar a desarrollar un plan de ejercicio gradual y adaptado.",
                    "Modificación de la Conducta (NIC 4360): Ayudar a identificar desencadenantes del comer en exceso. Fomentar el autorregistro de ingesta y actividad.",
                    "Apoyo Emocional (NIC 5270): Explorar factores emocionales asociados a la ingesta.",
                    "Derivación: Considerar derivación a dietista/nutricionista o grupo de apoyo."
                ]
                },
                {
                    "id": "00095",
                    "label": "Deterioro del patrón de sueño",
                    "definicion": "Interrupciones durante el tiempo de sueño/vigilia limitadas en el tiempo que causan malestar o interfieren en el estilo de vida deseado.",
                    "relacionadoCon": [
                        "Factores ambientales: Ruido, luz, interrupciones, temperatura inadecuada, cama incómoda.",
                        "Factores fisiológicos: Dolor, disnea, nicturia, fiebre, náuseas, posición.",
                        "Factores psicológicos: Ansiedad, estrés, miedo, depresión, duelo.",
                        "Factores farmacológicos: Estimulantes, alcohol, diuréticos, efectos secundarios de otros fármacos.",
                        "Patrones de actividad/descanso: Horarios irregulares, cambios de turno, inactividad, siestas diurnas.",
                        "Higiene del sueño inadecuada."
                    ],
                    "manifestadoPor": [
                        "Informe verbal de dificultad para conciliar el sueño o permanecer dormido.",
                        "Despertar precoz o más tarde de lo deseado.",
                        "Informe verbal de no sentirse descansado.",
                        "Somnolencia diurna.",
                        "Disminución de la capacidad funcional.",
                        "Irritabilidad, cambios de humor.",
                        "Dificultad para concentrarse.",
                        "Observación de inquietud o agitación.",
                        "Círculos oscuros bajo los ojos."
                    ],
                    "resultadosEsperados": [
                        "El paciente referirá haber dormido lo suficiente y sentirse descansado. (NOC 0004 Sueño)",
                        "El paciente identificará factores que interrumpen su sueño.",
                        "El paciente implementará prácticas que favorezcan el sueño (higiene del sueño).",
                        "El paciente demostrará una mejora en el estado de ánimo y nivel de energía diurno.",
                        "El paciente dormirá un número adecuado de horas para su edad/necesidad."
                    ],
                    "intervenciones": [
                        "Mejorar el Sueño (NIC 1850): Evaluar patrón de sueño habitual y factores que lo alteran. Usar diario de sueño si es necesario.",
                        "Manejo Ambiental: Confort (NIC 6482): Minimizar ruido y luz. Ajustar temperatura. Asegurar cama cómoda.",
                        "Fomento de la Higiene del Sueño: Establecer rutina relajante antes de dormir. Horarios regulares. Evitar cafeína/alcohol/nicotina por la tarde/noche. Limitar líquidos antes de acostarse. Evitar ejercicio intenso o comidas pesadas cerca de la hora de dormir.",
                        "Manejo del Dolor/Síntomas (NIC 1400): Controlar síntomas físicos que interfieran.",
                        "Reducción de la Ansiedad (NIC 5820): Si la ansiedad interfiere con el sueño.",
                        "Técnicas de Relajación (NIC 5880): Respiración profunda, relajación muscular.",
                        "Administración de Medicación: Hipnóticos (NIC 2300): Administrar según prescripción, preferiblemente a corto plazo.",
                        "Limitar Siestas Diurnas: Evitar siestas largas o tardías."
                    ]
                }
            // ... (muchas más entradas de nandaData omitidas por brevedad) ...
        ];


        // Pesos por frecuencia de uso de etiquetas NANDA (Estimados, ajustar según evidencia local si es posible)
        const nandaFrequencyWeights = {
            "00132": 50, "00133": 48, "00004": 47, "00046": 46, "00047": 45, "00304": 44,
            "00312": 43, "00085": 42, "00155": 41, "00303": 41, "00040": 40, "00031": 39,
            "00032": 38, "00030": 37, "00039": 36, "00103": 35, "00011": 34, "00015": 33,
            "00013": 32, "00014": 31, "00016": 30, "00017": 29, "00018": 28, "00019": 27,
            "00020": 26, "00021": 25, "00022": 24, "00023": 23, "00027": 22, "00028": 21,
            "00026": 20, "00025": 19, "00195": 18, "00002": 17, "00001": 16, "00232": 16,
            "00233": 16, "00003": 15, "00146": 14, "00148": 13, "00126": 12, "00069": 11,
            "00276": 10, "00078": 10, "00179": 9,  "00128": 8,  "00129": 7,  "00092": 6,
            "00093": 5,  "00095": 4,  "00198": 4,  "00102": 3,  "00108": 2,  "00109": 1,
            "00110": 1
            // ... (pueden faltar pesos para etiquetas menos comunes)
        };

        // --- NANDA Search Logic ---
        document.addEventListener('DOMContentLoaded', () => {
            const nandaTabContent = document.getElementById('nandaContent');
            if (!nandaTabContent) return; // Exit if NANDA tab content isn't found

            // Select elements *within* the NANDA tab content
            const nandaContainer = nandaTabContent.querySelector('.nanda-container');
            const manifestationsContainer = nandaTabContent.querySelector('#symptomsContainer');
            const addManifestationButton = nandaTabContent.querySelector('#addManifestationButton');
            const searchButton = nandaTabContent.querySelector('#searchButton');
            const resultsArea = nandaTabContent.querySelector('#resultsArea');
            let manifestationCount = 4; // Initial number of manifestation inputs

             // Check if all required elements were found
             if (!nandaContainer || !manifestationsContainer || !addManifestationButton || !searchButton || !resultsArea) {
                 console.error("Error: Uno o más elementos esenciales del buscador NANDA no se encontraron en el DOM.");
                 // Optionally display an error message to the user in the resultsArea
                 if (resultsArea) {
                      resultsArea.innerHTML = "<p style='color: red; font-weight: bold;'>Error al inicializar el buscador NANDA. Faltan elementos HTML.</p>";
                 }
                 return; // Stop execution if elements are missing
             }

            function normalizeText(text) {
                 if (!text) return '';
                 return text.toLowerCase()
                        .normalize("NFD") // Separate accents from letters
                        .replace(/[\u0300-\u036f]/g, "") // Remove accents
                        .replace(/[.,;()"\[\]]/g, '') // Remove common punctuation
                        .replace(/\s+/g, ' ').trim(); // Normalize whitespace
            }

             // Pre-process synonyms for faster lookup
             const normalizedSynonymsMap = new Map();
             for (const key in diccionarioSinonimos) {
                 const normalizedKey = normalizeText(key);
                 // Ensure all synonyms map back to the same Set object representing the concept
                 const synonymSet = new Set(diccionarioSinonimos[key].map(normalizeText));
                 synonymSet.add(normalizedKey); // Add the original key itself

                 synonymSet.forEach(synonym => {
                     normalizedSynonymsMap.set(synonym, synonymSet);
                 });
             }

            // Words indicating negation
            const negationWords = ['no', 'sin', 'ausencia de', 'negacion de', 'niega', 'descarta', 'no hay', 'carece de', 'nunca', 'jamas'];
            const proximity = 3; // How many words after negation word to check

            function isNegated(text, term) {
                 const normalizedText = normalizeText(text);
                 const normalizedTerm = normalizeText(term);
                 if (!normalizedTerm) return false;

                 // Simple check first: if the term IS a negation word
                 if (negationWords.includes(normalizedTerm)) return false; // e.g., input "no" shouldn't negate "no" in the text

                 // Check for negation words before the term
                 const escapedTerm = normalizedTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // Escape regex characters in term
                 try {
                      // Regex: \b(negation word)\s+ (up to 'proximity' words) \b(term)\b
                      const regexPattern = `\\b(${negationWords.join('|')})\\s+(?:[\\w\\s]+\\s+){0,${proximity}}?${escapedTerm}\\b`;
                      const negationRegex = new RegExp(regexPattern, 'i'); // Case-insensitive search
                      return negationRegex.test(normalizedText);
                 } catch (e) {
                      console.error("Regex error in isNegated:", e, "Pattern:", regexPattern);
                      return false; // Avoid crashing if regex fails
                 }
            }


            addManifestationButton.addEventListener('click', () => {
                manifestationCount++;
                const newInput = document.createElement('input');
                newInput.type = 'text';
                newInput.classList.add('manifestation-input'); // Use correct class
                newInput.placeholder = `Manifestación ${manifestationCount}`; // Update placeholder
                manifestationsContainer.appendChild(newInput);
            });

            searchButton.addEventListener('click', performSearch); // Use standard event listener

            function performSearch() {
                 resultsArea.innerHTML = '<p>Buscando...</p>'; // Indicate searching

                const manifestationInputs = manifestationsContainer.querySelectorAll('.manifestation-input');
                const normalizedInputPhrases = new Set(); // Store full normalized input phrases
                 const expandedNormalizedKeywords = new Set(); // Store individual words AND their synonyms, normalized
                const originalInputKeywords = new Set(); // Keep original casing/accents for highlighting

                // --- Process User Inputs ---
                manifestationInputs.forEach(input => {
                    const rawValue = input.value.trim();
                    if (rawValue) {
                         const normalizedPhrase = normalizeText(rawValue);
                         if (normalizedPhrase.length > 2) {
                              normalizedInputPhrases.add(normalizedPhrase);
                         }

                         // Extract words, normalize, expand synonyms, and store original
                         const words = rawValue.split(/\s+/);
                         words.forEach(word => {
                             const cleanedWord = word.replace(/[.,;()"\[\]]/g, ''); // Clean punctuation for original
                             const normalizedWord = normalizeText(cleanedWord);

                             if (normalizedWord.length > 2) {
                                 // Add the normalized word itself
                                 expandedNormalizedKeywords.add(normalizedWord);
                                 originalInputKeywords.add(cleanedWord.toLowerCase()); // Store original (lowercase) for highlighting

                                 // Add synonyms if found
                                 if (normalizedSynonymsMap.has(normalizedWord)) {
                                     normalizedSynonymsMap.get(normalizedWord).forEach(synonym => {
                                         expandedNormalizedKeywords.add(synonym);
                                         // Note: We don't add synonyms to originalInputKeywords, only the user's actual words
                                     });
                                 }
                             }
                         });
                    }
                });

                if (expandedNormalizedKeywords.size === 0 && normalizedInputPhrases.size === 0) {
                    resultsArea.innerHTML = '<p>Por favor, ingresa al menos una manifestación para buscar.</p>';
                    return;
                }

                const normalizedPhrasesArray = Array.from(normalizedInputPhrases);
                const normalizedKeywordsArray = Array.from(expandedNormalizedKeywords);
                 const originalKeywordsArray = Array.from(originalInputKeywords); // Use this for highlighting


                // --- Calculate Matches and Scores ---
                const matches = [];
                nandaData.forEach(entry => {
                    let score = 0;
                    const matchedManifestationIndices = new Set(); // Track which manifestations matched

                    // Normalize NANDA entry fields once
                    const normalizedNandaLabel = normalizeText(entry.label);
                    const normalizedNandaDef = normalizeText(entry.definicion);
                    const normalizedNandaRelatedText = Array.isArray(entry.relacionadoCon) ? normalizeText(entry.relacionadoCon.join(' ')) : '';
                     // Combine all manifestations into one string for keyword/phrase searching, handling potential null
                     const normalizedNandaManifestationsText = Array.isArray(entry.manifestadoPor) ? normalizeText(entry.manifestadoPor.join(' ')) : '';

                    // 1. Phrase Matching (Higher Weight)
                    normalizedPhrasesArray.forEach(phrase => {
                         if (!isNegated(phrase, phrase)) { // Check if input phrase itself is negated
                            if (normalizedNandaLabel.includes(phrase) && !isNegated(normalizedNandaLabel, phrase)) score += 15;
                            if (normalizedNandaDef.includes(phrase) && !isNegated(normalizedNandaDef, phrase)) score += 5;
                             if (normalizedNandaRelatedText.includes(phrase) && !isNegated(normalizedNandaRelatedText, phrase)) score += 8; // Phrase in related/risk factors
                             if (normalizedNandaManifestationsText.includes(phrase) && !isNegated(normalizedNandaManifestationsText, phrase)) score += 10; // Phrase in manifestations
                         }
                    });

                    // 2. Keyword Matching (Lower Weight, checks expanded keywords)
                    normalizedKeywordsArray.forEach(keyword => {
                         if (!isNegated(keyword, keyword)) { // Check if keyword itself is negated
                            // Use regex for whole word matching (\b)
                            const regex = new RegExp(`\\b${keyword}\\b`, 'gi'); // Case insensitive, global

                             // Score based on where keyword is found (avoid double counting if phrase also matched)
                            if (regex.test(normalizedNandaLabel) && !isNegated(normalizedNandaLabel, keyword)) score += 8;
                            if (regex.test(normalizedNandaDef) && !isNegated(normalizedNandaDef, keyword)) score += 2;
                             if (regex.test(normalizedNandaRelatedText) && !isNegated(normalizedNandaRelatedText, keyword)) score += 3; // Keyword in related/risk
                             if (regex.test(normalizedNandaManifestationsText) && !isNegated(normalizedNandaManifestationsText, keyword)) score += 5; // Keyword in manifestations
                         }
                    });

                    // 3. Find *which* manifestations contained matches (for highlighting and bonus)
                     if (Array.isArray(entry.manifestadoPor)) {
                         entry.manifestadoPor.forEach((manifestation, index) => {
                             const normalizedManifestation = normalizeText(manifestation);
                              let manifestationMatched = false;
                             // Check phrases first
                             normalizedPhrasesArray.forEach(phrase => {
                                  if (!isNegated(phrase, phrase) && normalizedManifestation.includes(phrase) && !isNegated(normalizedManifestation, phrase)) {
                                       manifestationMatched = true;
                                  }
                             });
                              // Check keywords if no phrase matched or to be sure
                              if (!manifestationMatched) {
                                   normalizedKeywordsArray.forEach(keyword => {
                                        if (!isNegated(keyword, keyword)) {
                                             const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                                             if (regex.test(normalizedManifestation) && !isNegated(normalizedManifestation, keyword)) {
                                                  manifestationMatched = true;
                                             }
                                        }
                                   });
                              }

                              if (manifestationMatched) {
                                   matchedManifestationIndices.add(index);
                              }
                         });
                     }

                    // 4. Bonus score for each matching manifestation line found
                    score += matchedManifestationIndices.size * 3;

                    // 5. Add Frequency Weight (scaled)
                     const frequencyWeight = nandaFrequencyWeights[entry.id] || 0;
                     score += (frequencyWeight / 10); // Scale down frequency weight impact

                    // Add to matches if score is positive
                    if (score > 0) {
                        matches.push({
                            ...entry,
                            score,
                            matchedManifestationIndices: Array.from(matchedManifestationIndices)
                        });
                    }
                });

                // Sort matches by score (highest first)
                matches.sort((a, b) => b.score - a.score);

                // --- Group Results by Domain ---
                const groupedResults = {};
                const sinCategoria = { dominioNum: 99, dominioNombre: "Sin Categoría / Otros", items: [] };

                matches.forEach(match => {
                    const categoriaInfo = categoriasNANDA[match.id];
                    if (categoriaInfo) {
                        const { dominioNum, dominioNombre } = categoriaInfo;
                        if (!groupedResults[dominioNum]) {
                            groupedResults[dominioNum] = { nombre: dominioNombre, items: [] };
                        }
                        groupedResults[dominioNum].items.push(match);
                    } else {
                        console.warn(`ID NANDA "${match.id}" (${match.label}) no encontrado en categoriasNANDA.`);
                        sinCategoria.items.push(match); // Add to the "Other" category
                    }
                });
                // Add the "Other" category if it has items
                 if (sinCategoria.items.length > 0) {
                     groupedResults[sinCategoria.dominioNum] = sinCategoria;
                 }

                // Pass original keywords (lowercase) for highlighting
                displayGroupedResults(groupedResults, originalKeywordsArray);
            }

            // --- Display Logic (Handles Grouping and Nested Highlighting) ---
            function displayGroupedResults(groupedResults, originalKeywords) {
                if (Object.keys(groupedResults).length === 0) {
                    resultsArea.innerHTML = '<p>No se encontraron etiquetas NANDA que coincidan con las manifestaciones ingresadas (o las coincidencias estaban negadas).</p>';
                    return;
                }

                resultsArea.innerHTML = `<h2>Resultados Agrupados por Dominio (ordenados por relevancia):</h2>`;

                // Sort domains by the score of their highest-scoring item
                 const sortedDomainKeys = Object.keys(groupedResults).sort((a, b) => {
                     const maxScoreA = groupedResults[a].items.length > 0 ? groupedResults[a].items[0].score : 0;
                     const maxScoreB = groupedResults[b].items.length > 0 ? groupedResults[b].items[0].score : 0;
                     return maxScoreB - maxScoreA; // Sort descending by max score
                 });

                sortedDomainKeys.forEach((domainKey, domainIndex) => { // Added domainIndex
                    const domainData = groupedResults[domainKey];
                    const domainDetailsElement = document.createElement('details');
                    domainDetailsElement.classList.add('domain-category');
                    // --- Decide si el dominio debe estar abierto por defecto (opcional, por ahora no) ---
                    // if (domainIndex === 0) {
                    //     domainDetailsElement.open = true;
                    // }

                    const domainSummaryElement = document.createElement('summary');
                    const domainTitle = domainKey === "99" ? domainData.nombre : `Dominio ${domainKey}: ${domainData.nombre}`;
                    domainSummaryElement.textContent = `${domainTitle} (${domainData.items.length} resultado${domainData.items.length !== 1 ? 's' : ''})`;
                    domainDetailsElement.appendChild(domainSummaryElement);

                    const categoryResultsContainer = document.createElement('div');
                    categoryResultsContainer.classList.add('results-container'); // Contenedor para las etiquetas dentro del dominio

                    // --- Loop anidado para crear pestañas desplegables para cada ETIQUETA ---
                    domainData.items.forEach((result, resultIndex) => { // Added resultIndex

                        // Crear el <details> para la etiqueta individual
                        const resultDetails = document.createElement('details');
                        resultDetails.classList.add('result-item-details'); // Nueva clase para estilizar
                         // --- Decide si la primera etiqueta dentro del primer dominio debe estar abierta (opcional) ---
                         // if (domainIndex === 0 && resultIndex === 0) {
                         //     resultDetails.open = true;
                         // }

                        // Crear el <summary> que será el título de la etiqueta
                        const resultSummary = document.createElement('summary');
                        resultSummary.classList.add('result-item-summary'); // Nueva clase
                        resultSummary.innerHTML = highlightText(`${result.id} - ${result.label}`, originalKeywords); // Aplicar highlight al título también
                        resultDetails.appendChild(resultSummary);

                        // Crear el div que contendrá la información detallada de la etiqueta
                        const resultItemContent = document.createElement('div');
                        resultItemContent.classList.add('result-item-content'); // Nueva clase

                        // --- Toda la información (Definición, Relacionado, Manifestado, NOC, NIC) va DENTRO de resultItemContent ---

                        // 2. Definición
                        if (result.definicion) {
                            const definitionTitle = document.createElement('h4');
                            definitionTitle.textContent = "Definición:";
                            resultItemContent.appendChild(definitionTitle);
                            const definitionP = document.createElement('p');
                            definitionP.classList.add('definition-text');
                            definitionP.innerHTML = highlightText(result.definicion, originalKeywords);
                            resultItemContent.appendChild(definitionP);
                        }

                         // Function to highlight text (se mantiene igual)
                         function highlightText(text, keywords) {
                             if (!text || !keywords || keywords.length === 0) {
                                 return text;
                             }
                             let highlightedText = text;
                              const escapedKeywords = keywords.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
                              // Match whole words, case-insensitively, considering accents in the source text
                              const pattern = escapedKeywords.join('|')
                                  .replace(/a/gi, '[aáàâä]')
                                  .replace(/e/gi, '[eéèêë]')
                                  .replace(/i/gi, '[iíìîï]')
                                  .replace(/o/gi, '[oóòôö]')
                                  .replace(/u/gi, '[uúùûü]')
                                  .replace(/n/gi, '[nñ]');

                              try {
                                  const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
                                  highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
                              } catch(e) {
                                   console.error("Highlighting regex error:", e, "Pattern:", pattern);
                                   return text;
                              }
                             return highlightedText;
                         }


                        // 3. Relacionado Con / Factores de Riesgo
                        const isRiskDiagnosis = result.label.toLowerCase().startsWith('riesgo de');
                        if (Array.isArray(result.relacionadoCon) && result.relacionadoCon.length > 0) {
                            const relatedTitle = document.createElement('h4');
                            relatedTitle.textContent = isRiskDiagnosis ? "Factores de Riesgo:" : "Factores Relacionados:";
                            resultItemContent.appendChild(relatedTitle); // <-- Append to content div
                            const relatedList = document.createElement('ul');
                            result.relacionadoCon.forEach(item => {
                                const li = document.createElement('li');
                                li.innerHTML = highlightText(item, originalKeywords);
                                relatedList.appendChild(li);
                            });
                            resultItemContent.appendChild(relatedList); // <-- Append to content div
                        }

                        // 4. Manifestado Por (Characteristics Defining) - Only for non-risk
                        if (!isRiskDiagnosis) {
                             const manifestationsTitle = document.createElement('h4');
                             manifestationsTitle.textContent = "Características Definitorias (Manifestado Por):";
                             resultItemContent.appendChild(manifestationsTitle); // <-- Append to content div
                             const manifestationsList = document.createElement('ul');

                             if (Array.isArray(result.manifestadoPor) && result.manifestadoPor.length > 0) {
                                // const matchedIndicesSet = new Set(result.matchedManifestationIndices || []); // No se usa directamente para estilo ahora

                                 result.manifestadoPor.forEach((manifestationText, index) => {
                                     const li = document.createElement('li');
                                     li.innerHTML = highlightText(manifestationText, originalKeywords);
                                     manifestationsList.appendChild(li);
                                 });
                             } else {
                                 const li = document.createElement('li');
                                 li.innerHTML = "<i>(No se especificaron manifestaciones en los datos para esta etiqueta)</i>";
                                 manifestationsList.appendChild(li);
                             }
                             resultItemContent.appendChild(manifestationsList); // <-- Append to content div
                        }

                        // 5. Resultados Esperados (NOC)
                        if (Array.isArray(result.resultadosEsperados) && result.resultadosEsperados.length > 0) {
                            const outcomesTitle = document.createElement('h4');
                            outcomesTitle.textContent = "Resultados Sugeridos (NOC):";
                            resultItemContent.appendChild(outcomesTitle); // <-- Append to content div
                            const outcomesList = document.createElement('ul');
                            result.resultadosEsperados.forEach(item => {
                                const li = document.createElement('li');
                                li.textContent = item;
                                outcomesList.appendChild(li);
                            });
                            resultItemContent.appendChild(outcomesList); // <-- Append to content div
                        }

                        // 6. Intervenciones Sugeridas / Plan de Cuidados (NIC)
                        if (Array.isArray(result.intervenciones) && result.intervenciones.length > 0) {
                            const interventionsTitle = document.createElement('h4');
                            interventionsTitle.textContent = "Intervenciones Sugeridas (NIC):";
                            resultItemContent.appendChild(interventionsTitle); // <-- Append to content div
                            const interventionsList = document.createElement('ul');
                            result.intervenciones.forEach(item => {
                                const li = document.createElement('li');
                                li.textContent = item;
                                interventionsList.appendChild(li);
                            });
                            resultItemContent.appendChild(interventionsList); // <-- Append to content div
                        }

                        // --- Fin de la información detallada ---

                        // Añadir el contenido al <details> de la etiqueta
                        resultDetails.appendChild(resultItemContent);

                        // Añadir el <details> de la etiqueta al contenedor del dominio
                        categoryResultsContainer.appendChild(resultDetails);

                    }); // --- Fin del loop de etiquetas individuales ---

                    domainDetailsElement.appendChild(categoryResultsContainer);
                    resultsArea.appendChild(domainDetailsElement);
                }); // End loop through domains
            }

             // Set initial message in results area if it's the default one
             if(resultsArea && resultsArea.innerHTML.includes('agrupadas por Dominio')){
                 resultsArea.innerHTML = '<p>Ingrese manifestaciones en los campos de arriba y presione "Buscar Etiqueta NANDA" para ver los resultados.</p>';
             }

        }); // End DOMContentLoaded for NANDA

    })(); // End of NANDA IIFE

