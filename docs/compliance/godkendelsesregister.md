# Skolens godkendelsesregister

Registeret er en teknisk hjælp til dokumentation, ikke i sig selv en juridisk godkendelse.

## Skolens onboarding

1. Owner/administrator logger ind, opsætter authenticator-app og bekræfter sessionen med MFA (AAL2).
2. Skolen underskriver dokumentet i sit eget godkendte ESDH-/dokumentsystem. PDF og underskrift uploades ikke til ElevSpor.
3. Skolen beregner SHA-256 lokalt, fx `sha256sum dokument.pdf` eller PowerShell-kommandoen `Get-FileHash dokument.pdf -Algorithm SHA256`.
4. Under **Sikkerhed og godkendelse** registreres dokumenttype, version, status, datoer, godkenderrolle, intern arkivreference og SHA-256.
5. Skolen vælger eksplicit, om en dataminimeret leverandørnotifikation må oprettes. Modtageradressen returneres aldrig af API'et.
6. Skolen kontrollerer posten og fastsætter en reviewdato.

Brug aldrig personnavn i godkenderrolle eller arkivreference. Arkivreferencen må ikke være en URL.

## Dataminimering

Registeret gemmer kun skole-id, dokumenttype/version, status, godkendelses-/reviewdato, godkenderrolle, intern arkivreference og SHA-256. Outboxen gemmer kun et tilfældigt kunde-id, appversion, status, datoer og hash; ingen elevdata, underskriver, PDF, noter eller URL.

## Mail, adgang og omkostning

Løsningen bruger kun Supabase Postgres, Auth, funktioner og RLS. Outboxposter er `blocked_no_provider`: der findes ingen mail-worker, og intet sendes før en databehandler-egnet udbyder er godkendt og konfigureret separat.

Kun owner/admin med en aktuel AAL2-session kan bruge registerfunktionerne. Tabellerne har RLS og ingen direkte klientrettigheder. Lærere kan hverken hente registeret eller modtageradressen.
