¡Claro! Aquí tienes el código completo y corregido de `script.js`, integrando la lógica para usar botones en lugar del `<select>` para la calculadora. He añadido comentarios marcando las secciones modificadas o nuevas (`// --- NUEVO ---` o `// --- MODIFICADO ---`).

```javascript
// script.js - Versión Completa con Selección de Calculadora por Botones

// --- Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Asegúrate que la ruta es correcta para tu despliegue (relativa es más segura en GH Pages)
        navigator.serviceWorker.register('./service-worker.js')
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
// No es necesario llamarlo aquí si el HTML ya tiene la clase 'active' y el display correcto.
// showTab('calculator');


// --- CALCULATOR SCRIPT (IIFE Wrapper) ---
(function () {
    const $ = id => document.getElementById(id);
    const hiddenCalcType = $('calcTypeHidden'); // --- NUEVO: Referencia al input oculto ---
    const calcSelectionContainer = $('calcSelectionContainer'); // --- NUEVO: Contenedor de botones ---

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
         const formPlaceholder = $('formPlaceholder'); // --- NUEVO ---

         if (form && form.closest('#calculatorContent')) form.innerHTML = ''; // Check parent
         if (formulaArea && formulaArea.closest('#calculatorContent')) {
              formulaArea.innerHTML = '';
              formulaArea.style.display = 'none'; // --- NUEVO ---
         }
         if (resultDiv && resultDiv.closest('#calculatorContent')) {
              resultDiv.innerHTML = '';
              resultDiv.style.display = 'none'; // --- NUEVO ---
         }
         if (calcBtn && calcBtn.closest('#calculatorContent')) {
              calcBtn.disabled = false;
              calcBtn.style.display = 'none'; // --- NUEVO ---
         }
          // --- NUEVO: Resetear botones y placeholder ---
         const activeCalcButton = calcSelectionContainer?.querySelector('.calc-option-button.active');
         if (activeCalcButton) {
             activeCalcButton.classList.remove('active');
         }
         if (hiddenCalcType) {
             hiddenCalcType.value = ''; // Limpiar valor oculto
         }
         if (formPlaceholder && formPlaceholder.closest('#calculatorContent')) {
              formPlaceholder.style.display = 'block'; // Mostrar placeholder
         }
         if (form && form.closest('#calculatorContent')) { // Poner el placeholder dentro del form si se limpió
             form.innerHTML = '<p id="formPlaceholder" style="text-align: center; color: #718096; margin-top: 2rem; font-style: italic;">Seleccione un tipo de cálculo arriba para ver los campos necesarios.</p>';
         }

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
        // --- MODIFICADO: Leer del input oculto ---
        const calcType = hiddenCalcType?.value;
        const resultDiv = $("result");
         // Clear results if mix inputs change
         if ((calcType === 'mix' || calcType === 'mixGlucosa') && resultDiv && resultDiv.closest('#calculatorContent')) {
            resultDiv.innerHTML = '';
        }
    }

    window.renderInputs = function() {
        // --- MODIFICADO: Leer del input oculto y gestionar visibilidad ---
        const t = hiddenCalcType?.value;
        const formContainer = $("formulario");
        const formulaDisplayContainer = $("formulaDisplayArea");
        const calcButton = $('calcBtn');
        const resultDiv = $("result"); // Añadido para ocultar/mostrar
        const formPlaceholder = $('formPlaceholder'); // Añadido

        // Control inicial de visibilidad basado en si 't' tiene valor
        if (!t) {
            // Si no hay cálculo seleccionado (estado inicial o después de limpiar)
            limpiar(); // Llama a limpiar para asegurar estado inicial
            if(formPlaceholder) formPlaceholder.style.display = 'block';
            if(formContainer) formContainer.innerHTML = ''; // Limpiar por si acaso
            if(formulaDisplayContainer) formulaDisplayContainer.style.display = 'none';
            if(calcButton) calcButton.style.display = 'none';
            if(resultDiv) resultDiv.style.display = 'none';
            return; // Detener la ejecución
        } else {
             // Si hay un cálculo seleccionado, ocultar placeholder y mostrar áreas
             if(formPlaceholder) formPlaceholder.style.display = 'none';
             if(formContainer) form.innerHTML = ''; // Limpiar antes de llenar
             if(formulaDisplayContainer) formulaDisplayContainer.style.display = 'block';
             if(calcButton) calcButton.style.display = 'block';
             if(resultDiv) resultDiv.style.display = 'block'; // Mostrar área de resultado (se llenará al calcular)
        }

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

        // --- ELIMINADO: Código que añadía clase 'option-selected' al select ---

        if (t && formulas[t]) {
             const displayClass = (t === 'pvc') ? 'info-display-static' : 'formula-display-static';
             displayHtml = `<div class="${displayClass}">${formulas[t]}</div>`;
        }

        // El switch case permanece igual que antes...
         switch (t) {
             case 'normo': case 'venti':
                 htmlInputs += input('peso', 'Peso (kg)');
                 htmlInputs += input('horas', 'Horas');
                 break;
             case 'hiper':
                 htmlInputs += input('peso', 'Peso (kg)');
                 htmlInputs += input('grados', '°C sobre 37');
                 htmlInputs += input('horas', 'Horas');
                 break;
             case 'quemaduras':
                 htmlInputs += input('peso', 'Peso (kg)');
                 htmlInputs += input('constante', 'Constante (1-6)');
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
        // Los onchange definidos en el HTML para mix y las selects custom siguen funcionando
        if (t === 'mix') {
             const targetPercentInput = $("targetPercent");
             if(targetPercentInput && targetPercentInput.closest('#calculatorContent')) { // Check context
                 targetPercentInput.addEventListener('input', updPctHelper); // Add listener para helper text
             }
             toggleObjetivo(); // Set initial visibility based on default selection
             toggleCustomInputs('baseSel', 'customBaseInputs'); // Check custom visibility
             toggleCustomInputs('concSel', 'customConcInputs'); // Check custom visibility
         }
    }; // Fin de renderInputs

    // La función toggleObjetivo permanece igual
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

    // La función calcular necesita leer el valor del input oculto
    window.calcular = function() {
        // --- MODIFICADO: Leer del input oculto ---
        const t = hiddenCalcType?.value;
        const resultDiv = $("result");

        // Ensure resultDiv exists and is in the calculator context
        if (!resultDiv || !resultDiv.closest('#calculatorContent')) {
             console.error("Result area not found or out of scope.");
             return;
        }
        resultDiv.innerHTML = ''; // Clear previous result
        resultDiv.style.display = 'block'; // Asegurar que es visible

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
             // El switch case permanece igual que antes...
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
    }; // Fin de calcular

    // La función calcMix permanece igual
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

         return resultString;
     } // Fin de calcMix


    // --- NUEVO: Event Listener para los Botones de Selección de Cálculo ---
    if (calcSelectionContainer) {
        calcSelectionContainer.addEventListener('click', function (event) {
            // Verificar que se hizo clic en un botón de opción y no en el espacio entre ellos
            const clickedButton = event.target.closest('.calc-option-button'); // Busca el botón más cercano
            if (clickedButton && calcSelectionContainer.contains(clickedButton)) { // Asegura que el botón está dentro del contenedor
                const selectedValue = clickedButton.dataset.value;

                // Actualizar el valor del input oculto
                if (hiddenCalcType) {
                    hiddenCalcType.value = selectedValue;
                }

                // Gestionar la clase 'active'
                const currentActive = calcSelectionContainer.querySelector('.calc-option-button.active');
                if (currentActive && currentActive !== clickedButton) {
                    currentActive.classList.remove('active');
                }
                clickedButton.classList.add('active');

                // Llamar a renderInputs para actualizar el formulario
                renderInputs();

                // Opcional: Scroll suave hacia el formulario
                 const formElement = $('formulario');
                 if(formElement) {
                      // Da un pequeño tiempo para que el DOM se actualice antes de hacer scroll
                      setTimeout(() => {
                            formElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }, 100); // 100ms de espera
                 }
            }
        });
    }

    // --- MODIFICADO: Llamada inicial para asegurar estado correcto ---
    renderInputs(); // Renderiza el estado inicial (placeholder visible, form/result/btn ocultos)

})(); // End of calculator IIFE


// --- NANDA SCRIPT (IIFE Wrapper) ---
(function () {

    // --- Diccionario de Sinónimos (TRUNCADO - RECOMENDACIÓN: Externalizar a JSON) ---
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
        // ... (Considera cargar esto desde un JSON)
    };

    // --- Categorías NANDA (Map ID to Domain - TRUNCADO - RECOMENDACIÓN: Externalizar a JSON) ---
    const categoriasNANDA = {
        "00078": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
        "00099": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
        "00162": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
        "00188": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
        "00215": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
        "00262": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
        "00276": { dominioNum: 1, dominioNombre: "Promoción de la salud" },
        // ... (resto de categorías, mucho más extenso)
        "00001": { dominioNum: 2, dominioNombre: "Nutrición" },
        "00002": { dominioNum: 2, dominioNombre: "Nutrición" },
        "00003": { dominioNum: 2, dominioNombre: "Nutrición" },
        "00025": { dominioNum: 2, dominioNombre: "Nutrición" },
        "00026": { dominioNum: 2, dominioNombre: "Nutrición" },
        "00027": { dominioNum: 2, dominioNombre: "Nutrición" },
        "00028": { dominioNum: 2, dominioNombre: "Nutrición" },
        "00104": { dominioNum: 2, dominioNombre: "Nutrición" },
        "00107": { dominioNum: 2, dominioNombre: "Nutrición" },
        "00163": { dominioNum: 2, dominioNombre: "Nutrición" },
        "00179": { dominioNum: 2, dominioNombre: "Nutrición" },
        "00216": { dominioNum: 2, dominioNombre: "Nutrición" },
        "00232": { dominioNum: 2, dominioNombre: "Nutrición" },
        "00233": { dominioNum: 2, dominioNombre: "Nutrición" },
        "00234": { dominioNum: 2, dominioNombre: "Nutrición" },
        "00011": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
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
        "00235": { dominioNum: 3, dominioNombre: "Eliminación e intercambio" },
        "00029": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
        "00032": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
        "00040": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
        "00085": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
        "00088": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
        "00091": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
        "00092": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
        "00093": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
        "00094": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
        "00095": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
        "00096": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
        "00102": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
        "00108": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
        "00109": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
        "00110": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
        "00168": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
        "00198": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
        "00204": { dominioNum: 4, dominioNombre: "Actividad/Reposo" }, // Estaba en D11, pero aquí es más lógico
        "00237": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
        "00238": { dominioNum: 4, dominioNombre: "Actividad/Reposo" },
        "00051": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
        "00122": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
        "00126": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
        "00128": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
        "00129": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
        "00131": { dominioNum: 5, dominioNombre: "Percepción/Cognición" },
        "00118": { dominioNum: 6, dominioNombre: "Autopercepción" },
        "00119": { dominioNum: 6, dominioNombre: "Autopercepción" },
        "00120": { dominioNum: 6, dominioNombre: "Autopercepción" },
        "00124": { dominioNum: 6, dominioNombre: "Autopercepción" },
        "00125": { dominioNum: 6, dominioNombre: "Autopercepción" },
        "00152": { dominioNum: 6, dominioNombre: "Autopercepción" },
        "00054": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
        "00055": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
        "00060": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
        "00061": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
        "00062": { dominioNum: 7, dominioNombre: "Rol/Relaciones" },
        // Sexualidad D8 omitido por brevedad
        "00069": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
        "00072": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
        "00114": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
        "00135": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" }, // Duelo
        "00136": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" }, // Duelo complicado
        "00137": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" }, // Duelo complicado, riesgo de
        "00146": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
        "00148": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
        "00177": { dominioNum: 9, dominioNombre: "Afrontamiento/Tolerancia al estrés" },
        "00066": { dominioNum: 10, dominioNombre: "Principios vitales" },
        "00004": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
        "00005": { dominioNum: 11, dominioNombre: "Seguridad/Protección" }, // Riesgo desequilibrio temp
        "00006": { dominioNum: 11, dominioNombre: "Seguridad/Protección" }, // Hipotermia
        "00007": { dominioNum: 11, dominioNombre: "Seguridad/Protección" }, // Hipertermia
        "00008": { dominioNum: 11, dominioNombre: "Seguridad/Protección" }, // Termorregulación ineficaz
        "00010": { dominioNum: 11, dominioNombre: "Seguridad/Protección" }, // Riesgo disreflexia
        "00031": { dominioNum: 11, dominioNombre: "Seguridad/Protección" }, // Limpieza ineficaz vías aéreas
        "00035": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
        "00038": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
        "00039": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
        "00043": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
        "00045": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
        "00046": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
        "00047": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
        "00048": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
        "00086": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
        "00087": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
        "00100": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
        "00103": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
        "00139": { dominioNum: 11, dominioNombre: "Seguridad/Protección" }, // Riesgo violencia otros
        "00140": { dominioNum: 11, dominioNombre: "Seguridad/Protección" }, // Riesgo violencia auto
        "00150": { dominioNum: 11, dominioNombre: "Seguridad/Protección" }, // Riesgo suicidio
        "00155": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
        "00206": { dominioNum: 11, dominioNombre: "Seguridad/Protección" },
        "00247": { dominioNum: 11, dominioNombre: "Seguridad/Protección" }, // Riesgo deterioro mucosa oral
        "00248": { dominioNum: 11, dominioNombre: "Seguridad/Protección" }, // Riesgo deterioro integridad tisular
        "00303": { dominioNum: 11, dominioNombre: "Seguridad/Protección" }, // Riesgo lesión presión niño
        "00304": { dominioNum: 11, dominioNombre: "Seguridad/Protección" }, // Riesgo lesión presión adulto
        "00312": { dominioNum: 11, dominioNombre: "Seguridad/Protección" }, // Lesión por presión adulto
        "00053": { dominioNum: 12, dominioNombre: "Confort" }, // Aislamiento social
        "00132": { dominioNum: 12, dominioNombre: "Confort" },
        "00133": { dominioNum: 12, dominioNombre: "Confort" },
        "00134": { dominioNum: 12, dominioNombre: "Confort" },
        "00214": { dominioNum: 12, dominioNombre: "Confort" },
        "00255": { dominioNum: 12, dominioNombre: "Confort" }, // Síndrome dolor crónico
        "00111": { dominioNum: 13, dominioNombre: "Crecimiento/Desarrollo" },
        "00112": { dominioNum: 13, dominioNombre: "Crecimiento/Desarrollo" }
        // ... muchas categorías omitidas ...
    };

    // --- Base de datos NANDA (TRUNCADO - RECOMENDACIÓN: Externalizar a JSON) ---
    const nandaData = [
        // ... (Los datos NANDA que ya tenías, asegurándote que estén completos si es posible) ...
        // Ejemplo (asegúrate de tener todas las entradas relevantes aquí)
        { "id": "00132", "label": "Dolor agudo", /* ... resto de datos ... */ },
        { "id": "00133", "label": "Dolor crónico", /* ... resto de datos ... */ },
        { "id": "00004", "label": "Riesgo de infección", /* ... resto de datos ... */ },
        { "id": "00046", "label": "Deterioro de la integridad cutánea", /* ... */ },
        { "id": "00047", "label": "Riesgo de deterioro de la integridad cutánea", /* ... */ },
        { "id": "00304", "label": "Riesgo de lesión por presión en el adulto", /* ... */ },
        { "id": "00312", "label": "Lesión por presión en el adulto", /* ... */ },
        { "id": "00085", "label": "Deterioro de la movilidad física", /* ... */ },
        { "id": "00155", "label": "Riesgo de caídas", /* ... */ },
        { "id": "00040", "label": "Riesgo de síndrome de desuso", /* ... */ },
        { "id": "00031", "label": "Limpieza ineficaz de las vías aéreas", /* ... */ },
        { "id": "00032", "label": "Patrón respiratorio ineficaz", /* ... */ },
        { "id": "00030", "label": "Deterioro del intercambio gaseoso", /* ... */ },
        { "id": "00039", "label": "Riesgo de aspiración", /* ... */ },
        { "id": "00103", "label": "Deterioro de la deglución", /* ... */ },
        { "id": "00011", "label": "Estreñimiento", /* ... */ },
        { "id": "00015", "label": "Riesgo de estreñimiento", /* ... */ },
        { "id": "00013", "label": "Diarrea", /* ... */ },
        { "id": "00014", "label": "Incontinencia fecal", /* ... */ },
        { "id": "00016", "label": "Deterioro de la eliminación urinaria", /* ... */ },
        { "id": "00017", "label": "Incontinencia urinaria de estrés", /* ... */ },
        { "id": "00018", "label": "Incontinencia urinaria refleja", /* ... */ },
        { "id": "00019", "label": "Incontinencia urinaria de urgencia", /* ... */ },
        { "id": "00020", "label": "Incontinencia urinaria funcional", /* ... */ },
        { "id": "00021", "label": "Incontinencia urinaria total", /* ... */ },
        { "id": "00022", "label": "Riesgo de incontinencia urinaria de urgencia", /* ... */ },
        { "id": "00023", "label": "Retención urinaria", /* ... */ },
        { "id": "00027", "label": "Déficit de volumen de líquidos", /* ... */ },
        { "id": "00028", "label": "Riesgo de déficit de volumen de líquidos", /* ... */ },
        { "id": "00026", "label": "Exceso de volumen de líquidos", /* ... */ },
        { "id": "00025", "label": "Riesgo de desequilibrio de volumen de líquidos", /* ... */ },
        { "id": "00195", "label": "Riesgo de desequilibrio electrolítico", /* ... */ },
        { "id": "00002", "label": "Desequilibrio nutricional: ingesta inferior a las necesidades", /* ... */ },
        { "id": "00232", "label": "Obesidad", /* ... */ },
        { "id": "00003", "label": "Riesgo de desequilibrio nutricional por exceso", /* ... */ },
        { "id": "00146", "label": "Ansiedad", /* ... */ },
        { "id": "00148", "label": "Temor", /* ... */ },
        { "id": "00126", "label": "Conocimientos deficientes", /* ... */ },
        { "id": "00069", "label": "Afrontamiento inefectivo", /* ... */ },
        { "id": "00276", "label": "Autogestión ineficaz de la salud", /* ... */ },
        { "id": "00179", "label": "Riesgo de nivel de glucemia inestable", /* ... */ },
        { "id": "00128", "label": "Confusión aguda", /* ... */ },
        { "id": "00129", "label": "Confusión crónica", /* ... */ },
        { "id": "00092", "label": "Intolerancia a la actividad", /* ... */ },
        { "id": "00093", "label": "Fatiga", /* ... */ },
        { "id": "00198", "label": "Trastorno del patrón del sueño", /* ... */ },
        { "id": "00102", "label": "Déficit de autocuidado: alimentación", /* ... */ },
        { "id": "00108", "label": "Déficit de autocuidado: baño", /* ... */ },
        { "id": "00109", "label": "Déficit de autocuidado: vestido", /* ... */ },
        { "id": "00110", "label": "Déficit de autocuidado: uso del inodoro", /* ... */ },
        { "id": "00134", "label": "Náuseas", /* ... */ },
        { "id": "00029", "label": "Disminución del gasto cardíaco", /* ... */ },
        { "id": "00204", "label": "Perfusión tisular periférica ineficaz", /* ... */ },
        { "id": "00051", "label": "Deterioro de la comunicación verbal", /* ... */ },
        { "id": "00206", "label": "Riesgo de sangrado", /* ... */ },
        { "id": "00061", "label": "Cansancio del rol de cuidador", /* ... */ },
        { "id": "00005", "label": "Riesgo de desequilibrio de la temperatura corporal", /* ... */ },
        { "id": "00006", "label": "Hipotermia", /* ... */ },
        { "id": "00007", "label": "Hipertermia", /* ... */ },
        { "id": "00008", "label": "Termorregulación ineficaz", /* ... */ },
        { "id": "00010", "label": "Riesgo de disreflexia autónoma", /* ... */ },
        { "id": "00024", "label": "Perfusión tisular inefectiva (general/sistémica)", /* ... */ },
        { "id": "00035", "label": "Riesgo de lesión", /* ... */ },
        { "id": "00038", "label": "Riesgo de traumatismo físico", /* ... */ },
        { "id": "00043", "label": "Protección inefectiva", /* ... */ },
        { "id": "00045", "label": "Deterioro de la mucosa oral", /* ... */ },
        { "id": "00048", "label": "Deterioro de la dentición", /* ... */ },
        { "id": "00053", "label": "Aislamiento social", /* ... */ },
        { "id": "00054", "label": "Riesgo de soledad", /* ... */ },
        { "id": "00055", "label": "Desempeño inefectivo del rol", /* ... */ },
        { "id": "00060", "label": "Interrupción de los procesos familiares", /* ... */ },
        { "id": "00062", "label": "Riesgo de cansancio del rol de cuidador", /* ... */ },
        { "id": "00066", "label": "Sufrimiento espiritual", /* ... */ },
        { "id": "00072", "label": "Negación ineficaz", /* ... */ },
        { "id": "00086", "label": "Riesgo de disfunción neurovascular periférica", /* ... */ },
        { "id": "00087", "label": "Riesgo de lesión postural perioperatoria", /* ... */ },
        { "id": "00088", "label": "Deterioro de la deambulación", /* ... */ },
        { "id": "00091", "label": "Deterioro de la movilidad en la cama", /* ... */ },
        { "id": "00094", "label": "Riesgo de intolerancia a la actividad", /* ... */ },
        { "id": "00096", "label": "Deprivación de sueño", /* ... */ },
        { "id": "00099", "label": "Mantenimiento ineficaz de la salud", /* ... */ },
        { "id": "00100", "label": "Retraso en la recuperación quirúrgica", /* ... */ },
        { "id": "00104", "label": "Lactancia materna ineficaz", /* ... */ },
        { "id": "00111", "label": "Retraso en el crecimiento y desarrollo", /* ... */ },
        { "id": "00112", "label": "Riesgo de retraso en el desarrollo", /* ... */ },
        { "id": "00118", "label": "Trastorno de la imagen corporal", /* ... */ },
        { "id": "00119", "label": "Baja autoestima crónica", /* ... */ },
        { "id": "00120", "label": "Baja autoestima situacional", /* ... */ },
        { "id": "00122", "label": "Trastorno de la percepción sensorial (especificar: visual, auditiva, cinestésica, gustativa, táctil, olfativa)", /* ... */ },
        { "id": "00124", "label": "Desesperanza", /* ... */ },
        { "id": "00125", "label": "Impotencia", /* ... */ },
        { "id": "00131", "label": "Deterioro de la memoria", /* ... */ },
        { "id": "00135", "label": "Duelo disfuncional", /* ... */ },
        { "id": "00140", "label": "Riesgo de violencia autodirigida", /* ... */ },
        { "id": "00150", "label": "Riesgo de suicidio", /* ... */ },
        { "id": "00152", "label": "Riesgo de impotencia", /* ... */ },
        { "id": "00168", "label": "Sedentarismo", /* ... */ },
        { "id": "00177", "label": "Estrés por sobrecarga", /* ... */ },
        { "id": "00214", "label": "Disconfort", /* ... */ },
        { "id": "00255", "label": "Síndrome de dolor crónico", /* ... */ },
        { "id": "00001", "label": "Desequilibrio nutricional: ingesta superior a las necesidades", /* ... */ },
        { "id": "00095", "label": "Deterioro del patrón de sueño", /* ... */ }
    ];


    // --- Pesos por frecuencia (Estimados - RECOMENDACIÓN: Externalizar a JSON) ---
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
        // ... (pesos para otras etiquetas pueden faltar o ser 0 por defecto)
    };

    // --- NANDA Search Logic ---
    // Mapa pre-procesado para sinónimos (se llenará después de cargar los datos o al inicio)
    const normalizedSynonymsMap = new Map();
    // Palabras de negación
    const negationWords = ['no', 'sin', 'ausencia de', 'negacion de', 'niega', 'descarta', 'no hay', 'carece de', 'nunca', 'jamas'];
    const proximity = 3; // Palabras de proximidad para negación

    function normalizeText(text) {
         if (!text) return '';
         return text.toLowerCase()
                .normalize("NFD") // Separar acentos
                .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
                .replace(/[.,;()"\[\]]/g, '') // Quitar puntuación común
                .replace(/\s+/g, ' ').trim(); // Normalizar espacios
    }

    function preprocessSynonyms() {
         normalizedSynonymsMap.clear();
         for (const key in diccionarioSinonimos) {
             const normalizedKey = normalizeText(key);
             const synonymSet = new Set(diccionarioSinonimos[key].map(normalizeText));
             synonymSet.add(normalizedKey); // Añadir la clave original normalizada

             synonymSet.forEach(synonym => {
                 // Asegurarse que todas las variantes apunten al MISMO set
                 if (!normalizedSynonymsMap.has(synonym)) {
                    normalizedSynonymsMap.set(synonym, synonymSet);
                 }
             });
         }
         console.log("Sinónimos pre-procesados.");
    }


    function isNegated(text, term) {
         const normalizedText = normalizeText(text);
         const normalizedTerm = normalizeText(term);
         if (!normalizedTerm) return false;
         if (negationWords.includes(normalizedTerm)) return false; // No negar la palabra de negación

         const escapedTerm = normalizedTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
         try {
              const regexPattern = `\\b(${negationWords.join('|')})\\s+(?:[\\w\\s]+\\s+){0,${proximity}}?${escapedTerm}\\b`;
              const negationRegex = new RegExp(regexPattern, 'i');
              return negationRegex.test(normalizedText);
         } catch (e) {
              console.error("Regex error in isNegated:", e, "Pattern:", regexPattern);
              return false;
         }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const nandaTabContent = document.getElementById('nandaContent');
        if (!nandaTabContent) return;

        // Elementos dentro de la pestaña NANDA
        const manifestationsContainer = nandaTabContent.querySelector('#symptomsContainer');
        const addManifestationButton = nandaTabContent.querySelector('#addManifestationButton');
        const searchButton = nandaTabContent.querySelector('#searchButton');
        const resultsArea = nandaTabContent.querySelector('#resultsArea');
        let manifestationCount = 4; // Cont inputs iniciales

         if (!manifestationsContainer || !addManifestationButton || !searchButton || !resultsArea) {
             console.error("Error: Uno o más elementos esenciales del buscador NANDA no se encontraron.");
             if (resultsArea) {
                  resultsArea.innerHTML = "<p style='color: red; font-weight: bold;'>Error al inicializar el buscador NANDA.</p>";
             }
             return;
         }

        // Pre-procesar sinónimos al cargar
        preprocessSynonyms();

        addManifestationButton.addEventListener('click', () => {
            manifestationCount++;
            const newInput = document.createElement('input');
            newInput.type = 'text';
            newInput.classList.add('manifestation-input');
            newInput.placeholder = `Manifestación ${manifestationCount}`;
            manifestationsContainer.appendChild(newInput);
        });

        searchButton.addEventListener('click', performSearch);

        function performSearch() {
             resultsArea.innerHTML = '<p>Buscando...</p>';

            const manifestationInputs = manifestationsContainer.querySelectorAll('.manifestation-input');
            const normalizedInputPhrases = new Set();
            const expandedNormalizedKeywords = new Set();
            const originalInputKeywords = new Set();

            manifestationInputs.forEach(input => {
                const rawValue = input.value.trim();
                if (rawValue) {
                     const normalizedPhrase = normalizeText(rawValue);
                     if (normalizedPhrase.length > 2) {
                          normalizedInputPhrases.add(normalizedPhrase);
                     }
                     const words = rawValue.split(/\s+/);
                     words.forEach(word => {
                         const cleanedWord = word.replace(/[.,;()"\[\]]/g, '');
                         const normalizedWord = normalizeText(cleanedWord);
                         if (normalizedWord.length > 2) {
                             expandedNormalizedKeywords.add(normalizedWord);
                             originalInputKeywords.add(cleanedWord.toLowerCase());
                             if (normalizedSynonymsMap.has(normalizedWord)) {
                                 normalizedSynonymsMap.get(normalizedWord).forEach(synonym => expandedNormalizedKeywords.add(synonym));
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
            const originalKeywordsArray = Array.from(originalInputKeywords);

            const matches = [];
            nandaData.forEach(entry => {
                let score = 0;
                const matchedManifestationIndices = new Set();

                // Normalizar campos NANDA (cacheable si los datos fueran estáticos y grandes)
                const normalizedNandaLabel = normalizeText(entry.label);
                const normalizedNandaDef = normalizeText(entry.definicion);
                const normalizedNandaRelatedText = Array.isArray(entry.relacionadoCon) ? normalizeText(entry.relacionadoCon.join(' ')) : '';
                const normalizedNandaManifestationsText = Array.isArray(entry.manifestadoPor) ? normalizeText(entry.manifestadoPor.join(' ')) : '';

                // 1. Phrase Matching
                normalizedPhrasesArray.forEach(phrase => {
                     if (!isNegated(phrase, phrase)) {
                        if (normalizedNandaLabel.includes(phrase) && !isNegated(normalizedNandaLabel, phrase)) score += 15;
                        if (normalizedNandaDef.includes(phrase) && !isNegated(normalizedNandaDef, phrase)) score += 5;
                        if (normalizedNandaRelatedText.includes(phrase) && !isNegated(normalizedNandaRelatedText, phrase)) score += 8;
                        if (normalizedNandaManifestationsText.includes(phrase) && !isNegated(normalizedNandaManifestationsText, phrase)) score += 10;
                     }
                });

                // 2. Keyword Matching
                normalizedKeywordsArray.forEach(keyword => {
                     if (!isNegated(keyword, keyword)) {
                        const regex = new RegExp(`\\b${keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
                        if (regex.test(normalizedNandaLabel) && !isNegated(normalizedNandaLabel, keyword)) score += 8;
                        if (regex.test(normalizedNandaDef) && !isNegated(normalizedNandaDef, keyword)) score += 2;
                        if (regex.test(normalizedNandaRelatedText) && !isNegated(normalizedNandaRelatedText, keyword)) score += 3;
                        if (regex.test(normalizedNandaManifestationsText) && !isNegated(normalizedNandaManifestationsText, keyword)) score += 5;
                     }
                });

                // 3. Find which manifestations matched
                 if (Array.isArray(entry.manifestadoPor)) {
                     entry.manifestadoPor.forEach((manifestation, index) => {
                         const normalizedManifestation = normalizeText(manifestation);
                         let manifestationMatched = false;
                         normalizedPhrasesArray.forEach(phrase => {
                              if (!isNegated(phrase, phrase) && normalizedManifestation.includes(phrase) && !isNegated(normalizedManifestation, phrase)) { manifestationMatched = true; }
                         });
                         if (!manifestationMatched) {
                             normalizedKeywordsArray.forEach(keyword => {
                                 if (!isNegated(keyword, keyword)) {
                                     const regex = new RegExp(`\\b${keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
                                     if (regex.test(normalizedManifestation) && !isNegated(normalizedManifestation, keyword)) { manifestationMatched = true; }
                                 }
                             });
                         }
                         if (manifestationMatched) { matchedManifestationIndices.add(index); }
                     });
                 }

                // 4. Bonus score for matching manifestations
                score += matchedManifestationIndices.size * 3;

                // 5. Frequency Weight
                 const frequencyWeight = nandaFrequencyWeights[entry.id] || 0;
                 score += (frequencyWeight / 10);

                if (score > 0) {
                    matches.push({
                        ...entry,
                        score,
                        matchedManifestationIndices: Array.from(matchedManifestationIndices)
                    });
                }
            });

            matches.sort((a, b) => b.score - a.score);

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
                    sinCategoria.items.push(match);
                }
            });
             if (sinCategoria.items.length > 0) {
                 groupedResults[sinCategoria.dominioNum] = sinCategoria;
             }

            displayGroupedResults(groupedResults, originalKeywordsArray);
        }

        function displayGroupedResults(groupedResults, originalKeywords) {
            if (Object.keys(groupedResults).length === 0) {
                resultsArea.innerHTML = '<p>No se encontraron etiquetas NANDA que coincidan con las manifestaciones ingresadas (o las coincidencias estaban negadas).</p>';
                return;
            }

            resultsArea.innerHTML = `<h2>Resultados Agrupados por Dominio (ordenados por relevancia):</h2>`;

             const sortedDomainKeys = Object.keys(groupedResults).sort((a, b) => {
                 const maxScoreA = groupedResults[a].items.length > 0 ? groupedResults[a].items[0].score : 0;
                 const maxScoreB = groupedResults[b].items.length > 0 ? groupedResults[b].items[0].score : 0;
                 return maxScoreB - maxScoreA;
             });

            sortedDomainKeys.forEach(domainKey => {
                const domainData = groupedResults[domainKey];
                const domainDetailsElement = document.createElement('details');
                domainDetailsElement.classList.add('domain-category');

                const domainSummaryElement = document.createElement('summary');
                const domainTitle = domainKey === "99" ? domainData.nombre : `Dominio ${domainKey}: ${domainData.nombre}`;
                domainSummaryElement.textContent = `${domainTitle} (${domainData.items.length} resultado${domainData.items.length !== 1 ? 's' : ''})`;
                domainDetailsElement.appendChild(domainSummaryElement);

                const categoryResultsContainer = document.createElement('div');
                categoryResultsContainer.classList.add('results-container');

                domainData.items.forEach(result => {
                    const resultDetails = document.createElement('details');
                    resultDetails.classList.add('result-item-details');

                    const resultSummary = document.createElement('summary');
                    resultSummary.classList.add('result-item-summary');
                    resultSummary.innerHTML = highlightText(`${result.id} - ${result.label}`, originalKeywords);
                    resultDetails.appendChild(resultSummary);

                    const resultItemContent = document.createElement('div');
                    resultItemContent.classList.add('result-item-content');

                    // Definición
                    if (result.definicion) {
                        const definitionTitle = document.createElement('h4');
                        definitionTitle.textContent = "Definición:";
                        resultItemContent.appendChild(definitionTitle);
                        const definitionP = document.createElement('p');
                        definitionP.classList.add('definition-text');
                        definitionP.innerHTML = highlightText(result.definicion, originalKeywords);
                        resultItemContent.appendChild(definitionP);
                    }

                    // Relacionado Con / Factores de Riesgo
                    const isRiskDiagnosis = result.label.toLowerCase().startsWith('riesgo de');
                    if (Array.isArray(result.relacionadoCon) && result.relacionadoCon.length > 0) {
                        const relatedTitle = document.createElement('h4');
                        relatedTitle.textContent = isRiskDiagnosis ? "Factores de Riesgo:" : "Factores Relacionados:";
                        resultItemContent.appendChild(relatedTitle);
                        const relatedList = document.createElement('ul');
                        result.relacionadoCon.forEach(item => {
                            const li = document.createElement('li');
                            li.innerHTML = highlightText(item, originalKeywords);
                            relatedList.appendChild(li);
                        });
                        resultItemContent.appendChild(relatedList);
                    }

                    // Manifestado Por
                    if (!isRiskDiagnosis) {
                         const manifestationsTitle = document.createElement('h4');
                         manifestationsTitle.textContent = "Características Definitorias (Manifestado Por):";
                         resultItemContent.appendChild(manifestationsTitle);
                         const manifestationsList = document.createElement('ul');
                         if (Array.isArray(result.manifestadoPor) && result.manifestadoPor.length > 0) {
                             result.manifestadoPor.forEach((manifestationText) => {
                                 const li = document.createElement('li');
                                 li.innerHTML = highlightText(manifestationText, originalKeywords);
                                 manifestationsList.appendChild(li);
                             });
                         } else {
                             const li = document.createElement('li');
                             li.innerHTML = "<i>(No se especificaron manifestaciones)</i>";
                             manifestationsList.appendChild(li);
                         }
                         resultItemContent.appendChild(manifestationsList);
                    }

                    // Resultados Esperados (NOC)
                    if (Array.isArray(result.resultadosEsperados) && result.resultadosEsperados.length > 0) {
                        const outcomesTitle = document.createElement('h4');
                        outcomesTitle.textContent = "Resultados Sugeridos (NOC):";
                        resultItemContent.appendChild(outcomesTitle);
                        const outcomesList = document.createElement('ul');
                        result.resultadosEsperados.forEach(item => {
                            const li = document.createElement('li');
                            li.textContent = item; // No resaltar NOC/NIC
                            outcomesList.appendChild(li);
                        });
                        resultItemContent.appendChild(outcomesList);
                    }

                    // Intervenciones Sugeridas (NIC)
                    if (Array.isArray(result.intervenciones) && result.intervenciones.length > 0) {
                        const interventionsTitle = document.createElement('h4');
                        interventionsTitle.textContent = "Intervenciones Sugeridas (NIC):";
                        resultItemContent.appendChild(interventionsTitle);
                        const interventionsList = document.createElement('ul');
                        result.intervenciones.forEach(item => {
                            const li = document.createElement('li');
                            li.textContent = item; // No resaltar NOC/NIC
                            interventionsList.appendChild(li);
                        });
                        resultItemContent.appendChild(interventionsList);
                    }

                    resultDetails.appendChild(resultItemContent);
                    categoryResultsContainer.appendChild(resultDetails);
                });

                domainDetailsElement.appendChild(categoryResultsContainer);
                resultsArea.appendChild(domainDetailsElement);
            });
        }

         // Función para resaltar texto
         function highlightText(text, keywords) {
             if (!text || !keywords || keywords.length === 0) {
                 return text;
             }
             let highlightedText = text;
              const escapedKeywords = keywords.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').trim()).filter(k => k.length > 0); // Escapar y limpiar
              if (escapedKeywords.length === 0) return text;

              // Mejorar regex para acentos y 'ñ' de forma más robusta
               const pattern = escapedKeywords.join('|')
                  .replace(/a/gi, '[aá]')
                  .replace(/e/gi, '[eé]')
                  .replace(/i/gi, '[ií]')
                  .replace(/o/gi, '[oó]')
                  .replace(/u/gi, '[uúü]') // Añadir ü
                  .replace(/n/gi, '[nñ]');

              try {
                  // Usar \b adaptado a caracteres latinos si es posible, o añadir espacios/puntuación
                   // const regex = new RegExp(`(?<![\\wáéíóúüñ])(${pattern})(?![\\wáéíóúüñ])`, 'gi'); // Lookaround puede no ser soportado universalmente
                   const regex = new RegExp(`\\b(${pattern})\\b`, 'gi'); // \b a veces falla con acentos
                   highlightedText = highlightedText.replace(regex, (match) => `<mark>${match}</mark>`);

              } catch(e) {
                   console.error("Highlighting regex error:", e, "Pattern:", pattern);
                   return text;
              }
             return highlightedText;
         }

         // Mensaje inicial en NANDA
         if(resultsArea && resultsArea.innerHTML.includes('agrupadas por Dominio')){
             resultsArea.innerHTML = '<p>Ingrese manifestaciones en los campos de arriba y presione "Buscar Etiqueta NANDA" para ver los resultados.</p>';
         }

    }); // End DOMContentLoaded for NANDA

})(); // End of NANDA IIFE
```

**Consideraciones Importantes:**

1.  **Datos NANDA:** Como mencioné antes, los datos (`diccionarioSinonimos`, `categoriasNANDA`, `nandaData`, `nandaFrequencyWeights`) siguen incrustados. Para una mejor performance y mantenibilidad, **deberías externalizarlos a archivos JSON** y cargarlos con `fetch` como se sugirió anteriormente. El código actual funcionará, pero será menos eficiente.
2.  **Completitud de Datos NANDA:** Asegúrate de que `nandaData` contenga *todas* las etiquetas NANDA que necesitas, no solo las del ejemplo, y que `categoriasNANDA` y `nandaFrequencyWeights` estén completos y correctos para tu versión de la taxonomía.
3.  **Pruebas:** Prueba exhaustivamente la nueva interfaz de botones de la calculadora y asegúrate de que todos los cálculos siguen funcionando como esperas.

Este código debería darte la funcionalidad y estructura que buscas, con la selección de cálculos mediante botones.
