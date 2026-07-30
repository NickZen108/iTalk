# Skolens GDPR- og sikkerhedspakke til ElevSpor

Denne mappe er en praktisk startpakke til skolens godkendelse og drift af
ElevSpor. Den er ikke juridisk rådgivning og er ikke i sig selv dokumentation
for, at skolen overholder alle regler. Skolen/kommunen er dataansvarlig og skal
færdiggøre, godkende og løbende vedligeholde materialet sammen med sin DPO,
informationssikkerhedsfunktion og eventuelle indkøbs-/jurafunktion.

## Hurtigt overblik

| Dokument | Formål | Skal skolen gøre noget? |
| --- | --- | --- |
| [Skole-onboarding](skole-onboarding.md) | Trin fra prøveprojekt til godkendt pilot og drift | Ja, alle stop-punkter skal godkendes |
| [DPA- og leverandørkontrol](dpa-leverandoerkontrol.md) | Supabase-DPA, underdatabehandlere og tredjelande | Ja, indgå aftale og dokumentér kontrollen |
| [Behandlingsfortegnelse](behandlingsfortegnelse.md) | Udkast til artikel 30-fortegnelse og behandlingsgrundlag | Ja, vælg og begrund hjemmel |
| [DPIA og risikovurdering](dpia-risikovurdering.md) | Screening, risici og foranstaltninger | Ja, vurder om DPIA er påkrævet og godkend restrisiko |
| [Hændelsesberedskab](haendelsesberedskab.md) | Procedure ved mistanke om databrud | Ja, indsæt kontaktpersoner og øv proceduren |
| [Backup og gendannelse](backup-gendannelse.md) | Krypteret Free Plan-backup og dokumenteret restore-test | Ja, vælg lager/nøgler og udfør testen |
| [DPO-godkendelse](dpo-godkendelse.md) | Samlet beslutnings- og sign-off-pakke | Ja, beslut og underskriv |
| [Godkendelsesregister](godkendelsesregister.md) | AAL2-register, dokumenthash og valgfri dataminimeret outbox | Ja, registrér skolens beslutninger |

## Statusnøgler

- `[UDFYLDES AF SKOLEN]`: oplysninger, som projektet ikke kan beslutte.
- `[BESLUTTES AF SKOLEN/DPO]`: juridisk eller risikomæssig vurdering.
- `[DOKUMENTATION VEDLÆGGES]`: bevis, aftale, skærmbillede eller rapport.
- `STOP`: løsningen må ikke tages i brug med rigtige elevdata, før punktet er
  afklaret.

## Minimum før rigtige elevdata

- [ ] Dataansvarlig, systemejer, DPO og beredskabskontakt er navngivet.
- [ ] Supabases DPA er indgået af en tegningsberettiget person.
- [ ] EU-regionen er verificeret på det konkrete Supabase-projekt.
- [ ] Aktuel underdatabehandlerliste og mulige tredjelandsoverførsler er
      vurderet og accepteret.
- [ ] Formål, datakategorier, behandlingsgrundlag og slettefrister er godkendt.
- [ ] Oplysningspligt til elever/forældre er udarbejdet i letforståeligt sprog.
- [ ] DPIA-screening er gennemført; eventuel DPIA er godkendt.
- [ ] Tekniske test, herunder adgang mellem to forskellige skoler, er bestået.
- [ ] Brudprocedure og kontaktvej er kendt af medarbejderne.
- [ ] Backup-/gendannelsesprocedure er valgt og testet.
- [ ] DPO/systemejer har underskrevet go/no-go.

## Hvad løsningen aktuelt behandler

Backendens formål er skoleadgang, elevadministration, aktivitetsregistrering og
månedsopgørelser. Den gemmer bl.a. elevens visningsnavn, valgfrit fødselsår,
pseudonym elevreference, status, tekniske id'er, aktivitetstype, tidspunkt,
varighed, enheds-/adgangsmetadata, medarbejderkonto og administrative
auditoplysninger. Samtaleindhold, lærernoter og elevfotos skal ikke sendes til
Supabase i den nuværende løsning.

Pseudonymiserede oplysninger er fortsat personoplysninger, når skolen kan
koble dem til en elev.

## Officielle hovedkilder

- [Datatilsynet: Skoler og daginstitutioner](https://www.datatilsynet.dk/regler-og-vejledning/skoler-og-daginstitutioner)
- [Datatilsynet: Den dataansvarliges forpligtelser](https://www.datatilsynet.dk/regler-og-vejledning/grundlaeggende-begreber/hvad-er-dine-forpligtelser/den-dataansvarliges-forpligtelser)
- [Datatilsynet: Risikovurdering](https://www.datatilsynet.dk/regler-og-vejledning/behandlingssikkerhed/risikovurdering)
- [GDPR, konsolideret tekst](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [Supabase DPA](https://supabase.com/downloads/docs/Supabase+DPA+260601.pdf)
- [Supabase: tilgængelige regioner](https://supabase.com/docs/guides/platform/regions)

Kilder og leverandørvilkår kan ændre sig. Kontrollér dem igen ved godkendelse
og mindst årligt.
