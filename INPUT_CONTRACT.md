# WaveSight Input Contract (v1)

Contrato de entrada para gerar analise EMC com classificacao normativa e relatorio tecnico.

## Objetivo
- Padronizar os dados recebidos para:
- aplicar regras por norma/pais
- avaliar pass/fail por banda/detector
- gerar insights com rastreabilidade

## Campos obrigatorios

`job_id`
- Identificador unico da analise.

`customer`
- `name`: nome do cliente.
- `project`: identificador do projeto.

`module`
- `type`: tipo do eletronico (ex.: `engine_ecu`, `infotainment`, `bms`, `charger`).
- `name`: nome comercial/tecnico do modulo.
- `hw_version`
- `sw_version`

`target_markets`
- Lista de mercados alvo (ex.: `["EU","US","BR"]`).

`test_context`
- `test_type`: ex.: `radiated_emission`, `conducted_emission`.
- `setup`: descricao do setup (ALSE, câmara, bancada etc.).
- `distance_m`: distancia de medicao (quando aplicavel).
- `detector`: `PK`, `AV`, `QP` ou lista quando houver.
- `rbw_khz`
- `vbw_khz` (ou `null` quando nao aplicavel).
- `sweep_time_ms` (ou `null`).
- `unit`: ex.: `dBuV`, `dBuV/m`.

`measurement_files`
- Lista de arquivos com metadados minimos:
- `file_name`
- `domain`: `frequency` (v1 padrao)
- `frequency_unit`: `Hz`, `kHz`, `MHz`
- `amplitude_unit`: `dBuV`, `dBuV/m`
- `columns`: mapeamento das colunas (ex.: `{"frequency":"frequency","amplitude":"intensity"}`)

`compliance_scope`
- `standards`: lista de normas alvo (ex.: `["CISPR25:Ed3","JLR-EMC-CS:v1.0:A4"]`)
- `strict_mode`: `true/false` (se faltar metadado, bloqueia classificacao normativa).

## Campos recomendados (forte impacto na qualidade)

`operating_modes`
- Lista dos modos da DUT testados (ex.: idle, tx_max, rx, charging).

`environment`
- `temperature_c`
- `supply_voltage_v`
- `battery_mode`

`instrumentation`
- `analyzer_model`
- `antenna_type`
- `antenna_height_m`
- `calibration_date`

`trace_metadata`
- `trace_type`: `live`, `max_hold`, `avg`.
- `scan_start`
- `scan_stop`

`business_context`
- `program_phase`: `R&D`, `pre_compliance`, `validation`.
- `deadline`
- `priority`

## Campos opcionais

`notes`
- Texto livre.

`attachments`
- Evidencias adicionais (fotos de setup, planos de teste, logs).

`country_overrides`
- Regras especificas de cliente/mercado que sobrepoem defaults.

## Regras de validacao minima (v1)

1. Se `strict_mode=true`, faltas em `detector`, `rbw_khz` ou `unit` invalidam classificacao normativa.
2. `measurement_files[*].domain` deve ser `frequency` na v1.
3. `frequency_unit` e `amplitude_unit` devem ser convertiveis para unidade interna.
4. Cada arquivo deve conter pelo menos duas colunas numericas (frequencia, amplitude).
5. `standards` deve ter pelo menos um item para emitir pass/fail normativo.

## Exemplo JSON (v1)

```json
{
  "job_id": "JOB-2026-00041",
  "customer": {
    "name": "Cliente X",
    "project": "PLAT-A1"
  },
  "module": {
    "type": "infotainment",
    "name": "HeadUnit Gen3",
    "hw_version": "3.2",
    "sw_version": "5.14.0"
  },
  "target_markets": ["EU", "US", "BR"],
  "test_context": {
    "test_type": "radiated_emission",
    "setup": "ALSE",
    "distance_m": 1.0,
    "detector": ["PK", "AV"],
    "rbw_khz": 120,
    "vbw_khz": 30,
    "sweep_time_ms": 80,
    "unit": "dBuV/m"
  },
  "measurement_files": [
    {
      "file_name": "sample_harmonics.csv",
      "domain": "frequency",
      "frequency_unit": "MHz",
      "amplitude_unit": "dBuV/m",
      "columns": {
        "frequency": "frequency",
        "amplitude": "intensity"
      }
    }
  ],
  "compliance_scope": {
    "standards": ["CISPR25:Ed3", "JLR-EMC-CS:v1.0:A4"],
    "strict_mode": true
  },
  "operating_modes": ["idle", "bluetooth_tx"],
  "environment": {
    "temperature_c": 25,
    "supply_voltage_v": 13.5,
    "battery_mode": "12V_lab_supply"
  },
  "notes": "Teste de pre-compliance."
}
```

## Evolucao prevista (v2+)
- Suporte oficial a `domain=time` com FFT (exigindo `sampling_rate` ou coluna de tempo).
- Multiplos detectores por banda na mesma corrida com validacao de coerencia.
- Mapeamento automatico `module.type -> standards` por mercado.
