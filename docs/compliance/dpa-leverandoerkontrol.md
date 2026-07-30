# DPA-, underdatabehandler- og tredjelandstjek

Skolen skal kontrollere den kontrakt og konto, den faktisk anvender.
Links nedenfor er hjælp, ikke bevis for at en aftale er indgået.

## 1. Rolle og kontraktpart

- Dataansvarlig juridisk enhed: `[UDFYLDES]`
- Supabase-kontoens organisationsejer: `[UDFYLDES]`
- Kontrakt/DPA-part hos Supabase: `[UDFYLDES FRA AFTALEN]`
- DPA-version og dato: `[UDFYLDES]`
- Tiltrådt af tegningsberettiget: `[NAVN, DATO, BEVIS VEDLÆGGES]`
- Behandlingens genstand, varighed, formål, data og registrerede stemmer med
  ElevSpor-fortegnelsen: `[JA/NEJ + AFVIGELSER]`
- Instruks, fortrolighed, sikkerhed, underdatabehandlere, bistand ved
  rettigheder/brud/DPIA, sletning/returnering og audit er dækket:
  `[JA/NEJ + BEMÆRKNINGER]`

**STOP:** En offentlig DPA-PDF er ikke det samme som dokumentation for, at
skolen har indgået den.

## 2. Region og data residency

- Supabase project ref: `[UDFYLDES – IKKE HEMMELIG NØGLE]`
- Valgt specifik region: `[UDFYLDES]`
- Dashboard-/kontraktbevis med dato: `[VEDLÆGGES]`
- Read replicas/andre regioner: `[INGEN ELLER UDFYLDES]`
- Backups og deres lokation: `[BEKRÆFTES]`

Vælg en godkendt EU/EØS-region. Supabase oplyser, at projektet placeres i én
primær region, men skolen skal fortsat kontrollere support,
underdatabehandlere, telemetri og andre mulige behandlingssteder.

## 3. Underdatabehandlere

Ved godkendelse og mindst årligt:

| Leverandør | Tjeneste/formål | Land(e) | Data/adgang | Overførselsgrundlag | Godkendt/dato |
| --- | --- | --- | --- | --- | --- |
| `[FRA AKTUEL SUPABASE-LISTE]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |

- Kilde/URL til aktuel liste: `[UDFYLDES]`
- Hentet dato og arkiveret kopi/hash: `[UDFYLDES]`
- Varslingsmekanisme ved ændringer er aktiveret: `[JA/NEJ]`
- Skolens frist og proces for indsigelse: `[UDFYLDES]`

Listen skal hentes fra den aktuelle DPA/legal portal; kopier ikke en statisk
liste fra denne repository som sandhed.

## 4. Tredjelandsoverførsler

For hver mulig overførsel eller fjernadgang:

- Modtager/land/formål/data: `[UDFYLDES]`
- Er landet dækket af EU-tilstrækkelighedsafgørelse: `[JA/NEJ]`
- Ellers anvendte SCC-modul og parter: `[UDFYLDES]`
- Transfer Impact Assessment: `[VEDLÆGGES]`
- Supplerende tekniske/organisatoriske foranstaltninger: `[UDFYLDES]`
- Regeringsadgang og praktisk mulighed for håndhævelse vurderet:
  `[JA/NEJ + KONKLUSION]`
- Onward transfers dækket: `[JA/NEJ]`
- DPO/juridisk godkendelse: `[NAVN/DATO]`

En DPA eller SCC alene afslutter ikke nødvendigvis skolens konkrete
vurdering. Datatilsynet har i 2026 præciseret betydningen af klare instrukser
om tredjelandsoverførsler i databehandleraftaler.

## 5. Sikkerheds-due-diligence

- [ ] Supabases aktuelle sikkerhedsdokumentation er gennemgået.
- [ ] Relevant revisions-/assurancerapport er indhentet eller manglende
      adgang er risikovurderet. Supabase angiver, at fuld SOC 2-rapport kan
      kræve Team/Enterprise; et marketingudsagn er ikke en auditrapport.
- [ ] Shared-responsibility er fordelt: Supabase-platform vs. skolens app,
      adgang, nøgler, enheder, RLS, backup og overvågning.
- [ ] Incidentvarsel og supportkanal matcher skolens 72-timersberedskab.
- [ ] Sletning ved kontraktophør, backup-livscyklus og dataeksport er
      dokumenteret.
- [ ] Leverandørens kontinuitet, nedetid og Free Plan-begrænsninger er
      accepteret eller afhjulpet.
- [ ] Testbevis for tenant-isolation og mindst privilegium er vedlagt.

## 6. Beslutning

- Leverandør godkendt: `[JA / BETINGET / NEJ]`
- Betingelser og frister: `[UDFYLDES]`
- Review ved leverandørændring og senest: `[DATO]`
- Leverandøransvarlig: `[NAVN/DATO/SIGNATUR]`
- Informationssikkerhed: `[NAVN/DATO/SIGNATUR]`
- DPO/juridisk rådgivning: `[NAVN/DATO/BEMÆRKNINGER]`

## Officielle kilder

- [Supabase DPA](https://supabase.com/downloads/docs/Supabase+DPA+260601.pdf)
- [Supabase: tilgængelige regioner](https://supabase.com/docs/guides/platform/regions)
- [Supabase: security og compliance](https://supabase.com/docs/guides/security)
- [Supabase: shared responsibility og SOC 2](https://supabase.com/docs/guides/security/soc-2-compliance)
- [Datatilsynet: dataansvarliges forpligtelser](https://www.datatilsynet.dk/regler-og-vejledning/grundlaeggende-begreber/hvad-er-dine-forpligtelser/den-dataansvarliges-forpligtelser)
- [Datatilsynet: tredjelandsvilkår i DPA (2026)](https://www.datatilsynet.dk/presse-og-nyheder/nyhedsarkiv/2026/jan/vilkaar-i-databehandleraftalen-om-overfoersler-af-personoplysninger-til-tredjelande)
- [EU-Kommissionen: internationale overførsler](https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/rules-international-data-transfers_en)
- [EU-Kommissionen: SCC](https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/standard-contractual-clauses-scc_en)
