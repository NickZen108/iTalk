# Hændelses- og brudberedskab

Denne procedure aktiveres ved mistanke – ikke først når et brud er bevist.
Et brud kan vedrøre fortrolighed, integritet eller tilgængelighed.

## Kontaktkort

- Fælles akut kanal: `[TELEFON/MAIL/SERVICEDESK]`
- Hændelsesleder: `[NAVN/ROLLE/KONTAKT]`
- DPO: `[KONTAKT]`
- IT-sikkerhed: `[KONTAKT]`
- Systemejer: `[KONTAKT]`
- Supabase-support/incidentkanal: `[KONTRAKTSPECIFIK KANAL]`
- Presse/ledelse ved høj risiko: `[KONTAKT]`

Kontakterne skal kunne anvendes i ferier; 72-timersfristen stopper ikke.

## 0–1 time: anmeld, begræns og bevar spor

1. Registrér tidspunktet, hvor skolen først blev bekendt med mistanken.
2. Kontakt hændelseslederen straks. Brug ikke elevnavne i en åben kanal.
3. Begræns skaden: tilbagekald kompromitteret konto/enhed/token, men slet ikke
   bevismateriale.
4. Bevar relevante auditlogs, skærmbilleder, id'er og tidslinje sikkert.
5. Ved mistanke om leverandørbrud: kontakt Supabase og bed om hændelsesdata
   efter DPA'en.

## 1–24 timer: fastslå omfang og risiko

Dokumentér:

- hvad der skete og om det fortsætter,
- system, projekt, skole og tidsrum,
- berørte data og registrerede, herunder børn/sårbare elever,
- cirka antal personer og poster,
- om data blev læst, ændret, slettet eller utilgængeligt,
- sandsynlige følger for elever/medarbejdere,
- allerede udførte og planlagte afhjælpninger,
- om andre skoler/tenants er berørt,
- kendt gerningsaktør/modtager og mulighed for sikker tilbagesendelse/sletning.

Vurder risikoen for de berørtes rettigheder og frihedsrettigheder – ikke kun
skolens økonomi eller omdømme. DPO rådgiver; dataansvarlig træffer og
dokumenterer beslutningen.

## Senest 72 timer

- Hvis det er usandsynligt, at bruddet indebærer risiko: anmeldelse kan
  undlades, men vurdering og begrundelse skal dokumenteres.
- Hvis der er risiko: anmeld til Datatilsynet uden unødig forsinkelse og om
  muligt senest 72 timer efter kendskab.
- Hvis alle oplysninger ikke er klar: indsend første anmeldelse og supplér
  trinvist. Dokumentér årsag ved forsinkelse.
- Ved sandsynlig høj risiko: underret de berørte klart og uden unødig
  forsinkelse, medmindre en konkret undtagelse gælder.

Skolen skal anvende sin officielle anmeldelseskanal og godkendte skabelon.
Datatilsynets anmeldelse sker normalt via Virk.

## Minimumslog for hændelsen

- Hændelses-id: `[UDFYLDES]`
- Opdaget/bekendt: `[DATO/TID/TIDSZONE]`
- Anmeldt internt af: `[UDFYLDES]`
- Beskrivelse og årsag: `[UDFYLDES]`
- Datakategorier/antal/registreredes kategorier: `[UDFYLDES]`
- Risikovurdering og beslutning: `[UDFYLDES]`
- Datatilsynet anmeldt: `[JA/NEJ, DATO, KVITTERING/BEGRUNDELSE]`
- Berørte underrettet: `[JA/NEJ, DATO, TEKST/BEGRUNDELSE]`
- Leverandørkontakt og svar: `[UDFYLDES]`
- Begrænsning/afhjælpning: `[UDFYLDES]`
- Hændelsen lukket af/dato: `[UDFYLDES]`

Alle brud dokumenteres, også når de ikke anmeldes.

## Efter hændelsen

1. Bekræft permanent lukning og gendannelse.
2. Ret årsagen, opdatér risikovurdering/DPIA, tests og undervisning.
3. Gennemfør læringsmøde uden skyldplacering.
4. Følg op på berørte og eventuelle myndighedskrav.
5. Opbevar hændelsesdokumentationen efter skolens fastsatte frist.

## Øvelse

Mindst årligt og ved væsentlige ændringer:

- simulér mistet lærerenhed og lækket QR/adgangskode,
- mål tid til spærring, risikovurdering og ledelsesbeslutning,
- verificér ferie-/weekendkontakt,
- opdatér kontaktkort og procedure.

## Kilder

- [Datatilsynet: skoler – brud og 72 timer](https://www.datatilsynet.dk/regler-og-vejledning/skoler-og-daginstitutioner)
- [Datatilsynet: håndtering af brud (PDF)](https://www.datatilsynet.dk/Media/637886298435856391/H%C3%A5ndtering%20af%20brud%20p%C3%A5%20persondatasikkerheden.pdf)
- [GDPR artikel 33 og 34](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
