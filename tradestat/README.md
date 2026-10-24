# Tradestat — Filip's personal apps

Login (Google) → výběr aplikace.

- `/` — launcher (login + výběr)
- `/tradestat/` — TradeStat Pro (trading deník)
- `/shiftbook/` — Shiftbook (evidence pracovních směn + dýška)
- `/pravo/` — Právo (příprava na test: hodnocení témat + kartičky)

Všechny aplikace sdílejí stejný Firebase projekt (`tradestat-18e24`) a ukládají data pod `users/{uid}/data/{key}`:

- TradeStat: `trades`, `goals`, `journal`, `settings`, `mkdata`
- Shiftbook: `shifts`, `shift_settings`
- Právo: `law` (objekt `{id_tématu: 0–3}`)

Hostováno na GitHub Pages: <https://filiplangkramer.github.io/Tradestat/>
