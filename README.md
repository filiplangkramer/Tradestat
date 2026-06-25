# Tradestat — Filip's personal apps

Login (Google) → výběr aplikace.

- `/` — launcher (login + výběr)
- `/tradestat/` — TradeStat Pro (trading deník)
- `/shiftbook/` — Shiftbook (evidence pracovních směn + dýška)

Obě aplikace sdílejí stejný Firebase projekt (`tradestat-18e24`) a ukládají data pod `users/{uid}/data/{key}`:

- TradeStat: `trades`, `goals`, `journal`, `settings`, `mkdata`
- Shiftbook: `shifts`, `shift_settings`

Hostováno na GitHub Pages: <https://filiplangkramer.github.io/Tradestat/>
