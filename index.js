const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const idsCurrency = [
  "valorImovel",
  "valorFinanciado",
  "valorEntrada",
  "valorBeneficios",
  "valorSinal",
  "taxaAdm",
  "seguroMensal",
  "amortizacaoExtra",
];

const state = {
  syncing: false,
};

const el = (id) => document.getElementById(id);

function parseBRL(value) {
  if (typeof value === "number") return value;
  const clean = String(value)
    .replace(/\s/g, "")
    .replace(/R\$/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.-]/g, "");
  const num = parseFloat(clean);
  return Number.isFinite(num) ? num : 0;
}

function formatBRL(value) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatPercent(value) {
  return `${percentFormatter.format(value)}%`;
}

function sanitizeNumberInput(input, fallback = 0) {
  const v = parseFloat(input.value);
  return Number.isFinite(v) ? v : fallback;
}

function bindCurrencyInput(id) {
  const input = el(id);
  input.addEventListener("focus", () => {
    const value = parseBRL(input.value);
    input.value = value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  });
  input.addEventListener("blur", () => {
    input.value = formatBRL(parseBRL(input.value));
    recalculate();
  });
  input.addEventListener("input", () => {
    if (["valorImovel", "valorFinanciado", "valorEntrada"].includes(id)) {
      handleTriadInput(id);
    } else {
      recalculate();
    }
  });
}

function writeTriadFromPercentage() {
  const valorImovel = parseBRL(el("valorImovel").value);
  const percentualFinanciado = clamp(
    parseFloat(el("percentualFinanciado").value) || 0,
    0,
    100
  );
  const valorFinanciado = valorImovel * (percentualFinanciado / 100);
  const valorEntrada = Math.max(0, valorImovel - valorFinanciado);
  state.syncing = true;
  el("percentualFinanciadoLabel").textContent =
    formatPercent(percentualFinanciado);
  el("valorFinanciado").value = formatBRL(valorFinanciado);
  el("valorEntrada").value = formatBRL(valorEntrada);
  state.syncing = false;
}

function handleTriadInput(source) {
  if (state.syncing) return;
  const valorImovel = Math.max(0, parseBRL(el("valorImovel").value));
  let valorFinanciado = Math.max(0, parseBRL(el("valorFinanciado").value));
  let valorEntrada = Math.max(0, parseBRL(el("valorEntrada").value));
  let percentualFinanciado = clamp(
    parseFloat(el("percentualFinanciado").value) || 0,
    0,
    100
  );

  state.syncing = true;

  if (source === "valorImovel") {
    valorFinanciado = valorImovel * (percentualFinanciado / 100);
    valorEntrada = Math.max(0, valorImovel - valorFinanciado);
  } else if (source === "valorFinanciado") {
    valorFinanciado = clamp(valorFinanciado, 0, valorImovel);
    valorEntrada = Math.max(0, valorImovel - valorFinanciado);
    percentualFinanciado =
      valorImovel > 0 ? (valorFinanciado / valorImovel) * 100 : 0;
    el("percentualFinanciado").value = percentualFinanciado;
  } else if (source === "valorEntrada") {
    valorEntrada = clamp(valorEntrada, 0, valorImovel);
    valorFinanciado = Math.max(0, valorImovel - valorEntrada);
    percentualFinanciado =
      valorImovel > 0 ? (valorFinanciado / valorImovel) * 100 : 0;
    el("percentualFinanciado").value = percentualFinanciado;
  } else if (source === "percentualFinanciado") {
    valorFinanciado = valorImovel * (percentualFinanciado / 100);
    valorEntrada = Math.max(0, valorImovel - valorFinanciado);
  }

  el("percentualFinanciadoLabel").textContent =
    formatPercent(percentualFinanciado);
  el("valorFinanciado").value = formatBRL(valorFinanciado);
  el("valorEntrada").value = formatBRL(valorEntrada);
  el("valorImovel").value = formatBRL(valorImovel);
  state.syncing = false;

  recalculate();
}

function getValues() {
  const valorImovel = Math.max(0, parseBRL(el("valorImovel").value));
  const valorFinanciado = clamp(
    parseBRL(el("valorFinanciado").value),
    0,
    valorImovel
  );
  const valorEntrada = clamp(
    parseBRL(el("valorEntrada").value),
    0,
    valorImovel
  );
  const valorBeneficios = Math.max(0, parseBRL(el("valorBeneficios").value));
  const valorSinal = Math.max(0, parseBRL(el("valorSinal").value));
  const prazoObra = Math.max(
    1,
    Math.round(sanitizeNumberInput(el("prazoObra"), 36))
  );
  const prazoFinanciamento = Math.max(
    1,
    Math.round(sanitizeNumberInput(el("prazoFinanciamento"), 420))
  );
  const jurosAnual = Math.max(0, sanitizeNumberInput(el("jurosAnual"), 5.38));
  const trMensal = Math.max(0, sanitizeNumberInput(el("trMensal"), 0.17));
  const taxaAdm = Math.max(0, parseBRL(el("taxaAdm").value));
  const inccMensal = Math.max(0, sanitizeNumberInput(el("inccMensal"), 0.5));
  const seguroMensal = Math.max(0, parseBRL(el("seguroMensal").value));
  const amortizacaoExtra = Math.max(0, parseBRL(el("amortizacaoExtra").value));
  const percentualFinanciado =
    valorImovel > 0 ? (valorFinanciado / valorImovel) * 100 : 0;

  return {
    valorImovel,
    valorFinanciado,
    valorEntrada,
    valorBeneficios,
    valorSinal,
    prazoObra,
    prazoFinanciamento,
    jurosAnual,
    trMensal,
    taxaAdm,
    inccMensal,
    seguroMensal,
    amortizacaoExtra,
    percentualFinanciado,
  };
}

function calculateEntryInstallments(valorParceladoBase, inccRate, months) {
  if (months <= 0 || valorParceladoBase <= 0) {
    return { installments: [], total: 0, first: 0, last: 0 };
  }

  const monthlyBase = valorParceladoBase / months;
  const installments = [];
  let total = 0;

  for (let month = 1; month <= months; month++) {
    const installment = monthlyBase * Math.pow(1 + inccRate, month - 1);
    installments.push(installment);
    total += installment;
  }

  return {
    installments,
    total,
    first: installments[0] || 0,
    last: installments[installments.length - 1] || 0,
  };
}

function calculateConstructionEvolution(values) {
  const {
    valorImovel,
    valorFinanciado,
    prazoObra,
    jurosAnual,
    trMensal,
    taxaAdm,
    seguroMensal,
  } = values;

  const annualRate = jurosAnual / 100;
  const trRate = trMensal / 100;
  const correctionPart = valorImovel * 0.1 * trRate;
  const rows = [];
  let total = 0;
  let first = 0;
  let last = 0;

  for (let month = 1; month <= prazoObra; month++) {
    const progress = prazoObra === 1 ? 1 : (month - 1) / (prazoObra - 1);
    const desembolsado =
      valorImovel * 0.1 + (valorFinanciado - valorImovel * 0.1) * progress;
    const parcelaJuros = desembolsado * (annualRate / 12);
    const evolucao = parcelaJuros + correctionPart + seguroMensal + taxaAdm;
    rows.push({
      month,
      progress,
      desembolsado,
      parcelaJuros,
      parcelaCorrecao: correctionPart,
      evolucao,
    });
    total += evolucao;
    if (month === 1) first = evolucao;
    if (month === prazoObra) last = evolucao;
  }

  return { rows, total, first, last };
}

function simulateSAC(values) {
  const {
    valorFinanciado: principal,
    prazoFinanciamento,
    jurosAnual,
    trMensal,
    taxaAdm,
    seguroMensal,
    amortizacaoExtra,
  } = values;

  const rate = Math.pow(1 + jurosAnual / 100, 1 / 12) - 1;
  let saldo = principal;
  const amortizacaoBase =
    prazoFinanciamento > 0 ? principal / prazoFinanciamento : 0;
  const schedule = [];
  let totalPago = 0;
  let totalJuros = 0;
  let totalExtras = 0;
  let month = 0;

  while (saldo > 0.01 && month < prazoFinanciamento * 3) {
    month += 1;
    const juros = saldo * rate;
    const amortizacaoEfetiva = Math.min(
      saldo,
      amortizacaoBase + amortizacaoExtra
    );
    const prestacao = juros + amortizacaoEfetiva + seguroMensal;
    saldo = Math.max(0, saldo - amortizacaoEfetiva);
    totalPago += prestacao;
    totalJuros += juros;
    totalExtras += seguroMensal;
    schedule.push({
      month,
      prestacao,
      juros,
      amortizacao: amortizacaoEfetiva,
      saldo,
    });
  }

  return {
    schedule,
    totalPago,
    totalJuros,
    totalExtras,
    totalAmortizado: principal,
    firstInstallment: schedule[0]?.prestacao || 0,
    lastInstallment: schedule[schedule.length - 1]?.prestacao || 0,
    monthsToPayOff: schedule.length,
    reducedMonths: Math.max(0, prazoFinanciamento - schedule.length),
  };
}

function simulatePRICE(values) {
  const {
    valorFinanciado: principal,
    prazoFinanciamento,
    jurosAnual,
    trMensal,
    taxaAdm,
    seguroMensal,
    amortizacaoExtra,
  } = values;

  const rate = Math.pow(1 + jurosAnual / 100, 1 / 12) - 1;
  let saldo = principal;
  const paymentBase =
    rate === 0
      ? prazoFinanciamento > 0
        ? principal / prazoFinanciamento
        : 0
      : (principal * (rate * Math.pow(1 + rate, prazoFinanciamento))) /
        (Math.pow(1 + rate, prazoFinanciamento) - 1);

  const schedule = [];
  let totalPago = 0;
  let totalJuros = 0;
  let totalExtras = 0;
  let month = 0;

  while (saldo > 0.01 && month < prazoFinanciamento * 3) {
    month += 1;
    const juros = saldo * rate;
    let amortizacao = paymentBase - juros;
    if (amortizacao < 0) amortizacao = 0;
    amortizacao += amortizacaoExtra;
    amortizacao = Math.min(saldo, amortizacao);
    const prestacao = juros + amortizacao + seguroMensal;
    saldo = Math.max(0, saldo - amortizacao);
    totalPago += prestacao;
    totalJuros += juros;
    totalExtras += seguroMensal;
    schedule.push({
      month,
      prestacao,
      juros,
      amortizacao,
      saldo,
    });
  }

  return {
    schedule,
    totalPago,
    totalJuros,
    totalExtras,
    totalAmortizado: principal,
    firstInstallment: schedule[0]?.prestacao || 0,
    lastInstallment: schedule[schedule.length - 1]?.prestacao || 0,
    monthsToPayOff: schedule.length,
    reducedMonths: Math.max(0, prazoFinanciamento - schedule.length),
  };
}

function row(label, value) {
  return `<tr><td>${label}</td><td>${value}</td></tr>`;
}

function fillSummary(id, rows) {
  el(id).innerHTML = rows.join("");
}

function renderPreviewTable(targetId, schedule, limit = 12) {
  el(targetId).innerHTML = schedule
    .slice(0, limit)
    .map(
      (item) => `
        <tr>
          <td>${item.month}</td>
          <td>${formatBRL(item.prestacao)}</td>
          <td>${formatBRL(item.juros)}</td>
          <td>${formatBRL(item.amortizacao)}</td>
          <td>${formatBRL(item.saldo)}</td>
        </tr>
      `
    )
    .join("");
}

function renderConstructionTable(entrySchedule, evolutionSchedule, prazoObra) {
  const rows = [];
  for (let month = 1; month <= prazoObra; month++) {
    const parcelaEntrada = entrySchedule.installments[month - 1] || 0;
    const obra = evolutionSchedule.rows[month - 1]?.evolucao || 0;
    const total = parcelaEntrada + obra;
    rows.push(`
          <tr>
            <td>${month}</td>
            <td>Obra</td>
            <td>${formatBRL(parcelaEntrada)}</td>
            <td>${formatBRL(obra)}</td>
            <td>${formatBRL(total)}</td>
          </tr>
        `);
  }
  el("tabelaObra").innerHTML = rows.join("");
}

function recalculate() {
  const values = getValues();
  const errors = [];

  if (
    Math.abs(
      values.valorEntrada + values.valorFinanciado - values.valorImovel
    ) > 0.5
  ) {
    errors.push(
      "O valor da entrada e o valor financiado precisam somar o valor total do imóvel."
    );
  }

  const entradaLiquidaNecessaria = Math.max(
    0,
    values.valorEntrada - values.valorBeneficios
  );
  const valorParceladoBase = Math.max(
    0,
    entradaLiquidaNecessaria - values.valorSinal
  );

  if (values.valorSinal > entradaLiquidaNecessaria) {
    errors.push("O sinal está maior que a entrada líquida necessária.");
  }

  const entrySchedule = calculateEntryInstallments(
    valorParceladoBase,
    values.inccMensal / 100,
    values.prazoObra
  );
  const evolutionSchedule = calculateConstructionEvolution(values);
  const sac = simulateSAC(values);
  const price = simulatePRICE(values);

  const totalEntradaDesembolso = values.valorSinal + entrySchedule.total;
  const totalGeralSac =
    totalEntradaDesembolso +
    evolutionSchedule.total +
    sac.totalPago -
    values.valorBeneficios;
  const totalGeralPrice =
    totalEntradaDesembolso +
    evolutionSchedule.total +
    price.totalPago -
    values.valorBeneficios;
  const custoTotalEscolhido = Math.min(totalGeralSac, totalGeralPrice);

  el("cardEntradaLiquida").textContent = formatBRL(entradaLiquidaNecessaria);
  el("cardParceladoEntrada").textContent = formatBRL(entrySchedule.total);
  el("cardEvolucaoTotal").textContent = formatBRL(evolutionSchedule.total);
  el("cardCustoTotal").textContent = `${formatBRL(
    custoTotalEscolhido
  )} a ${formatBRL(Math.max(totalGeralSac, totalGeralPrice))}`;

  el("resumoSimples").innerHTML = [
    ["Valor do imóvel", formatBRL(values.valorImovel)],
    ["Percentual financiado", formatPercent(values.percentualFinanciado)],
    ["Valor financiado", formatBRL(values.valorFinanciado)],
    ["Entrada bruta", formatBRL(values.valorEntrada)],
    ["Benefícios abatendo entrada", formatBRL(values.valorBeneficios)],
    ["Sinal", formatBRL(values.valorSinal)],
    ["Saldo da entrada a parcelar", formatBRL(valorParceladoBase)],
    ["1ª parcela da entrada", formatBRL(entrySchedule.first)],
    ["Última parcela da entrada", formatBRL(entrySchedule.last)],
    ["1ª evolução de obra", formatBRL(evolutionSchedule.first)],
    ["Última evolução de obra", formatBRL(evolutionSchedule.last)],
    ["1ª parcela SAC", formatBRL(sac.firstInstallment)],
    ["1ª parcela PRICE", formatBRL(price.firstInstallment)],
    ["Custo total estimado SAC", formatBRL(totalGeralSac)],
    ["Custo total estimado PRICE", formatBRL(totalGeralPrice)],
  ]
    .map(
      ([k, v]) => `
        <div class="summary-item">
          <div class="k">${k}</div>
          <div class="v">${v}</div>
        </div>
      `
    )
    .join("");

  el("resumoEntrada").innerHTML = `
        <p><strong>Entrada bruta:</strong> ${formatBRL(values.valorEntrada)}</p>
        <p><strong>Benefícios abatendo entrada:</strong> ${formatBRL(
          values.valorBeneficios
        )}</p>
        <p><strong>Entrada líquida necessária:</strong> ${formatBRL(
          entradaLiquidaNecessaria
        )}</p>
        <p><strong>Sinal:</strong> ${formatBRL(values.valorSinal)}</p>
        <p><strong>Saldo parcelado da entrada:</strong> ${formatBRL(
          valorParceladoBase
        )}</p>
        <p><strong>Total pago nas parcelas da entrada:</strong> ${formatBRL(
          entrySchedule.total
        )}</p>
        <p><strong>1ª parcela da entrada:</strong> ${formatBRL(
          entrySchedule.first
        )}</p>
        <p><strong>Última parcela da entrada:</strong> ${formatBRL(
          entrySchedule.last
        )}</p>
      `;

  el("resumoObra").innerHTML = `
        <p><strong>Prazo até as chaves:</strong> ${values.prazoObra} meses</p>
        <p><strong>Total da evolução de obra:</strong> ${formatBRL(
          evolutionSchedule.total
        )}</p>
        <p><strong>1ª evolução de obra:</strong> ${formatBRL(
          evolutionSchedule.first
        )}</p>
        <p><strong>Última evolução de obra:</strong> ${formatBRL(
          evolutionSchedule.last
        )}</p>
        <p><strong>Correção monetária mensal informada:</strong> ${formatPercent(
          values.trMensal
        )}</p>
        <p><strong>Juros anual do financiamento:</strong> ${formatPercent(
          values.jurosAnual
        )}</p>
      `;

  fillSummary("resumoSac", [
    row("Valor financiado", formatBRL(values.valorFinanciado)),
    row("Prazo original", `${values.prazoFinanciamento} meses`),
    row("1ª parcela", formatBRL(sac.firstInstallment)),
    row("Última parcela", formatBRL(sac.lastInstallment)),
    row("Total de juros", formatBRL(sac.totalJuros)),
    row("Total de TR + seguro", formatBRL(sac.totalExtras)),
    row("Total pago no financiamento", formatBRL(sac.totalPago)),
    row("Quitação com amortização extra", `${sac.monthsToPayOff} meses`),
    row("Redução do prazo", `${sac.reducedMonths} meses`),
  ]);

  fillSummary("resumoPrice", [
    row("Valor financiado", formatBRL(values.valorFinanciado)),
    row("Prazo original", `${values.prazoFinanciamento} meses`),
    row("1ª parcela", formatBRL(price.firstInstallment)),
    row("Última parcela", formatBRL(price.lastInstallment)),
    row("Total de juros", formatBRL(price.totalJuros)),
    row("Total de TR + seguro", formatBRL(price.totalExtras)),
    row("Total pago no financiamento", formatBRL(price.totalPago)),
    row("Quitação com amortização extra", `${price.monthsToPayOff} meses`),
    row("Redução do prazo", `${price.reducedMonths} meses`),
  ]);

  renderPreviewTable("tabelaSac", sac.schedule);
  renderPreviewTable("tabelaPrice", price.schedule);
  renderConstructionTable(entrySchedule, evolutionSchedule, values.prazoObra);

  el("badgeQuitacao").textContent =
    values.amortizacaoExtra > 0
      ? `Com amortização extra: quitação em ${Math.min(
          sac.monthsToPayOff,
          price.monthsToPayOff
        )} meses`
      : "Sem amortização extra";

  const alerta = el("alertaValidacao");
  if (errors.length > 0) {
    alerta.classList.add("show");
    alerta.innerHTML = errors.map((err) => `<div>• ${err}</div>`).join("");
  } else {
    alerta.classList.remove("show");
    alerta.innerHTML = "";
  }
}

el("percentualFinanciado").addEventListener("input", () =>
  handleTriadInput("percentualFinanciado")
);
el("prazoObra").addEventListener("input", recalculate);
el("prazoFinanciamento").addEventListener("input", recalculate);
el("jurosAnual").addEventListener("input", recalculate);
el("trMensal").addEventListener("input", recalculate);
el("inccMensal").addEventListener("input", recalculate);

idsCurrency.forEach(bindCurrencyInput);

// Garante que o valor do imóvel inicial escreva os demais campos da tríade.
writeTriadFromPercentage();
recalculate();
