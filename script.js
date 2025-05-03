
    if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js') // Asegúrate que la ruta es correcta
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


   
