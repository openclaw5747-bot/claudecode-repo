# Large cyber, IT, grid and aviation incidents (2023 → Oct 2026): what caused them, whether they are rising, and how the WEF, Gates and 72-hour messages fit in
*Researched 2026-10-27 · verification re-run · 139 sources across 8 lanes: web ×2, YouTube, Reddit, news, academic, forums/social, official*

> **Method note.** This run opened primary documents wherever the server allowed it. Several sites returned 403 to our fetcher: weforum.org, mimikama.org, africacheck.org, CNBC, OpenAI, youtube.com watch pages and reddit.com. Where a claim rests only on a search snippet or on a secondary report, the appendix says so. Reddit was read through the Arctic Shift archive API and Hacker News through the Algolia API. Both are used for sentiment only.

## TL;DR
- **The biggest outages were accidental.** The causes were bad configuration or content pushes into very concentrated platforms: CrowdStrike, AWS us-east-1, Cloudflare (twice), Azure Front Door, Google Cloud and Verizon. Old or fragile infrastructure caused the Iberian blackout, the Heathrow substation fire, NATS, the FAA NOTAM system and Philadelphia TRACON. Each operator's own post-mortem or official report rules out a cyberattack or gives a non-malicious cause [36][38][40][41][42][43][64][69][105][108].
- **Malicious activity is real and getting more expensive, but it is a different kind of event.** It is mostly criminal ransomware through suppliers: JLR's ~£1.9bn loss, M&S's ~£300M hit, Collins Aerospace's MUSE system and the IDCF Cloud attack in Japan [58][60][100][45]. On top of that sit state pre-positioning (Volt Typhoon) and Russian-linked hybrid pressure: the Polish grid wiper, which caused no outage; drones; GPS jamming [79][71][118][121].
- **"Accelerating" depends on what you measure.** Severity metrics are rising: UK nationally significant incidents went from 89 to 204 and IMF tail-loss risk is up [23][29]. Outage *frequency* per data-centre site has fallen for five straight years [25]. Hyperscale cloud downtime dropped 28% in 2025 [27]. ENISA reports "fewer single high impact incidents" [24]. Drone and GNSS interference are clearly rising [118][120][123].
- **The WEF and Gates warnings are real quotes that were later misframed.** The Schwab line is genuine (8 Jul 2020) [1][2]. Fact-checkers rate "they planned it" claims **False** [5][9]. Gates' Sep–Oct 2026 warnings are about AI-enabled cyber capability [16][18].
- **The 72-hour advice predates PHP2Shell and comes from the EU's Niinistö report (Oct 2024).** The UK's "Be Ready" campaign (22 Oct 2026) says **"3 days"**, not 72 hours [85][89][90]. Its timing one day after PHP2Shell is a coincidence. Only one small Substack links the two to Cyber Polygon [22].

## Key findings

### 1. What WEF, Schwab and Gates actually said
- **Schwab's speech.** He opened Cyber Polygon on **8 Jul 2020** with: "…a comprehensive cyber attack, which would bring a complete halt to the power supply, transportation, hospital services, our society as a whole. The COVID-19 crisis would be seen in this respect as a small disturbance in comparison to a major cyber attack" [1][2]. The original speech is on the organiser BI.ZONE's YouTube channel, as listed on the Cyber Polygon 2020 agenda [3].
- **The viral clip** is a 35-second excerpt [5]. The figure of "11+ minutes" for the full speech comes from Mimikama, which we saw only in a snippet. CheckYourFact gives about 10 minutes [6][10].
- **The WEF's 2021 video** is not a Jurgens quote. Its line is "would spread faster and **farther** than any biological virus", spoken as the WEF's own voice, not by Jeremy Jurgens [1][9]. PolitiFact dates the video to 18 Jan 2021 and rates the "COVID was planned" claim built on it **False** [9].
- **Cyber Polygon 2021** was a supply-chain scenario with 200 teams from 48 countries. BI.ZONE (Sberbank) organised it, with Mishustin as guest of honour and INTERPOL's Jürgen Stock as a speaker [7][8].
- **WEF risk rankings:**
  - Global Risks Report 2024: misinformation #1 and cyber insecurity #4 over two years [11].
  - 2025: cyber espionage and warfare #5 over two years [12].
  - 2026: geoeconomic confrontation #1, cyber insecurity #9 for 2026 and #6 over two years [13].
- **Global Cybersecurity Outlook 2026:** 94% say AI is the biggest driver of change, 87% name AI vulnerabilities as the fastest-growing risk, and 31% have low confidence in national critical-infrastructure response. 73% were affected by cyber-enabled fraud. CEOs rank fraud first; CISOs rank ransomware first. The geopolitics figure is **64%**, not 66% [14].
- **Gates:**
  - TED 2015 quote verified [15].
  - **29 Sep 2026**, Ezra Klein/NYT: "The ability to do a cyberattack that scrambles all of the bank accounts, shuts down the electric grid — that exists today" [16][17].
  - **Sunday 11 Oct 2026**: "The front that we'll probably see most dramatically in the next year is cyberattacks." AFP says this was on ABC; Fox News says CNN's *State of the Union* [18][19].
  - CBS Evening News (Sep 2026): "it may be that we have to suffer a few of the negatives before we'll respond as fully as we should" [20].

### 2. Major incidents and confirmed causes
- **CrowdStrike (19 Jul 2024).** Channel File 291: the IPC Template Type "defined 21 input parameter fields, but the integration code… supplied only 20" [36]. Parametrix estimated a $5.4B direct loss for the Fortune 500 [37].
- **AWS (19–20 Oct 2025).** "a latent race condition in the DynamoDB DNS management system that resulted in an incorrect empty DNS record". DNS was restored by 2:25 AM PDT and the event ended at 2:20 PM PDT [38]. Downdetector logged more than 17M reports [39].
- **Cloudflare, 18 Nov 2025.** A permissions change doubled the size of a feature file. Cloudflare: "not caused, directly or indirectly, by a cyber attack or malicious activity of any kind" [40].
- **Cloudflare, 5 Dec 2025.** About 25 minutes and ~28% of HTTP traffic, caused by a React2Shell WAF change [41].
- **Google (12 Jun 2025)** was a null pointer [42]. **Verizon (14 Jan 2026)** was a "software issue" [43].
- **Exceptions that were physical or malicious:**
  - AWS UAE facilities "directly struck" by drones (Mar 2026) [44].
  - IDCF Cloud ransomware (7 Oct 2026), which hit 495 customers [45].
- **PHP2Shell (CVE-2026-109618/-109619, 21 Oct 2026).** The IDs are real; NVD and CISA confirm them, and both were added to KEV on 26 Oct [46][47][48].
  - NVD scores: v3.1 **9.8 and 8.1** respectively; v4 9.2 for both [46][47].
  - Leak and embargo: the CVE IDs and Calif's own PoC video leaked on 20 Oct, so the release was brought forward. The PHP Foundation called the delay a "structural failure" and said Chainguard broke the embargo [49][56].
  - Amazon MadPot logged an exploitation attempt on **17 Oct**, before disclosure [50].
  - **The "PHP mass outage" was mostly self-inflicted.** Governments took sites offline as a precaution: cyber.gov.au, Dutch and Finnish government sites, the Port of Rotterdam, Nepal's government and bank sites [54][55].
  - Unit 42's claim that a European government agency had been breached was **retracted on 25 Oct** [53].
  - Exposure: Censys counts ~2.58M hosts and Unit 42 counts 22.6M "potentially vulnerable" instances. "70%" is PHP's share of websites, not a count of exposed hosts [52][53][51].
- **UK 2025 attacks:**
  - M&S: ~£300M hit; DragonForce claimed it [58].
  - Co-op: data on all 6.5M members stolen [59].
  - JLR: £1.9bn, "the most economically damaging cyber event" in UK history [60].
  - The NCA arrested four people on 10 Jul 2025. No charges were found [61].
- **Iberian blackout.** Spain's government found "no indications or evidence pointing to a cyberattack" [64][65]. ENTSO-E's 49-member expert panel (20 Mar 2026) found "No single cause… Multiple interacting factors" in "the first ever [blackout] of its kind (overvoltage)" [62][63].
- **Heathrow / North Hyde.** Moisture had entered a transformer bushing. Elevated readings from July 2018 were not acted on. NESO made 12 recommendations, and Ofgem's investigation is still open [69][70].
- **Poland (29 Dec 2025).** A destructive wiper hit 30+ renewable sites and a CHP plant but "did not affect the ongoing production of electricity" [71]. Attribution is split: ESET says Sandworm, Dragos says ELECTRUM, and CERT Polska points to Berserk Bear/Static Tundra clusters [71][72][73].
- **Berlin (3 Jan 2026).** Left-wing arson claimed by Vulkangruppe cut power to ~45,000 households [75].
- **Minnesota (26–27 Jul 2026).** An OT attack hit 30+ water systems. It is unattributed [76].
- **Caracas (3 Jan 2026).** The blackout happened during the US raid. Gen. Caine cited Cyber Command "layering different effects", but no source proves cyber caused it [77].

### 3. Is it rising?
- **Severity is up:**
  - NCSC handled 429 incidents (flat), but 204 were "nationally significant" (up from 89) and 18 were highly significant (up from 12) [23].
  - Dragos tracked 119 ransomware groups hitting 3,300 industrial organisations; the number of groups rose 49% [28].
  - The IMF says cyber is "thus far not systemic" but the risk of ≥$2.5B losses "has increased" [29][30].
- **Frequency is not up:**
  - Uptime reports a fifth year of falling per-site outage frequency. Third-party, external and fiber causes are rising, and 57% of outages cost more than $100k [25][26].
  - Parametrix measured cloud downtime of 244.8h in 2024 and 175.3h in 2025, while noting AWS Oct 2025 was its largest single event [27].
  - ENISA analysed 4,875 incidents, 76.7% of them DDoS, mostly "very low impact" [24].
- **Concentration is the structural driver.** 89% of the top-100K sites critically depend on third-party DNS, CDN or CA providers [31]. Under DORA, almost a third of 3,383 major EU financial ICT incidents in 2025 came from third parties, and only about 10% were cyber [34][35].

### 4. 72-hour preparedness
- **EU.** The Commission's action is to "develop guidelines to reach a population self-sufficiency of minimum 72 hours" [85]. We found no evidence the guidelines have been published as of Oct 2026.
- **UK National Risk Register 2025.** National grid failure is rated catastrophic impact with 1–5% likelihood [87].
- **UK National Risk Register 2026:**
  - 95 risks in total [88].
  - A new "digital resilience failure" risk, "building on lessons from the global IT outage in July 2024" [88].
  - National power outage is "low likelihood but catastrophic" [88].
- **UK "Be Ready" (22 Oct 2026):**
  - It is the first stage of a three-year campaign, and the release quotes only Security Minister Dan Jarvis [89].
  - The official site says "Being ready for 3 days helps you manage while support reaches those in need" [90].
  - The 13% "prepared" figure comes from a 2025 survey [91].
  - Sell-outs were partly driven by storms that weekend [92].
- **Other countries:**
  - US: Ready.gov says "several days" [96].
  - Netherlands: "72 uur" [94].
  - Germany: BBK advises 3 to 10 days.
  - Ireland: 2.2M booklets sent from Sep 2026 [95].
- **US capacity is shrinking.** FEMA separations rose 55% in FY2025 [97]. The proposed FY27 CISA budget cuts about $700M in programs, net about $360M [98].

### 5. Aviation: what keeps failing
**Ground-side telecom and software single points of failure** are the main pattern:
- NATS Aug 2023: 700k+ passengers affected, 34 recommendations [104].
- NATS 8 Sep 2026: ">2,000 flights delayed, cancelled or diverted", caused by a millisecond-timing software defect [105][106].
- FAA NOTAM: Jan 2023, then two outages on 1 Feb and 22 Mar 2025 [139][107].
- Philadelphia TRACON: Apr/May 2025 copper failures (corroborated by wire reports; WHYY's URL was not captured). On 21 Sep 2026 an old Verizon circuit failed while the backup fiber had already been cut by an NJ Transit contractor [108][109].
- Airline data centres: Alaska on 20 Jul and 23 Oct 2025 [114][115].

**The confirmed malicious events:**
- Collins MUSE ransomware [100][101].
- Sea-Tac (Rhysida) [113].
- Drones: Copenhagen; Leipzig, which Germany blamed on Russia [117][119].
- GNSS jamming, now in EASA SIB 2022-02R4, published 3 Jul 2026 [121][122].

**FAA funding.** GAO found the new air traffic control system has no lifecycle cost estimate, and Duffy wants $30B on top of $12.5B [110][111].

## What people are saying
- **Practitioners say concentration and change control, not sabotage.** One r/sysadmin post scoring 690 put it as "This isn't a reliability issue; it's a topology issue" [133]. HN threads on CrowdStrike, AWS and Cloudflare blame global config pushes without canary rollout [126][127].
- **PHP2Shell debate** is about the embargo leak, AI-discovery hype and whether the bugs are exploitable in practice, not orchestration [125][129][130]. Reddit's UK users mostly backed the precautionary takedowns.
- **Be Ready:** r/UKPreppers is mostly calm. The top answer to "Why 3 days?" was "3 is just a reasonable number" [131]. r/unitedkingdom split between "sensible" and "fearmongering or blame-shifting" [132]. Video coverage is bigger and more sensational: 5 News ~333k views, WION's "72 Hour Blackout" title [138].
- **Conspiracy framing exists but gets little engagement in 2026.** An r/conspiracy "Cyber Polygon 10/26" post scored 3, and its top reply was "It's probably bullshit" [134]. A Substack strings Event 201, Cyber Polygon and 72-hour kits together with no evidence [22]. Back in 2024, AFP documented a "#cyberpolygon" surge after CrowdStrike [21]. The biggest predictive-programming video ("Leave the World Behind") has ~1.05M views [137].

## Points of disagreement / uncertainty
- **Attribution splits:**
  - Poland: Sandworm vs ELECTRUM vs Berserk Bear-like clusters [71][72][73].
  - Leipzig: Germany says "Russia"; the GRU link comes only from unnamed US officials [119].
  - Collins variant: HardBit vs Loki [102].
- **Gates 11 Oct venue:** ABC per AFP vs CNN per Fox [18][19].
- **ENTSO-E details** are only in trade press: 21 or 22 recommendations, 440 or 472 pages [66]. We could not find the "15 GW / 60% in 5 s" figure or the "not renewable energy, but voltage control" quote in any ENTSO-E material. Dissent: Porter blames an inverter oscillation [67]. The arXiv preprint calls it a "gray rhino" of voltage and protection failures [68].
- **Root causes never published:** NATS 30 Jul 2025, FAA NOTAM Feb 2025, United 6 Aug 2025 (Unimatic, details unpublished), American 28 Jul 2026 and Minneapolis ARTCC 6 Aug 2026. Alaska Oct 2025 was published only as a "primary data centre failure" [114].
- **No independent aviation IT outage time series exists after GAO-19-514 (2019).** "More airport chaos" cannot yet be measured.

## Testing the prior conclusion
The prior run's conclusion **mostly holds, with five corrections:**
1. **"Legacy" fits ATC and grid, not cloud.** The cloud outages came from *modern* automation pushing changes globally in seconds.
2. **PHP2Shell does not fit "accidental outage".** It was a real AI-assisted vulnerability with pre-disclosure exploitation attempts. The outage was a defensive self-shutdown, and the widely repeated government breach claim was retracted.
3. **The malicious bucket needs physical and non-Russian entries:** Berlin (domestic extremists), Caracas (US military), AWS UAE (Iran-war drones) and Minnesota (unattributed).
4. **"Rising" should be split:** severity and drone/GNSS activity are up; outage frequency and cloud downtime are not.
5. **UK messaging does explicitly cite IT failures.** The NRR 2026 risk builds on CrowdStrike. So it is all-hazards, but cyber and IT are named drivers, not afterthoughts.

The claim that the WEF and Gates warnings were generic and that no plan exists stands [5][9].

## Bottom line
The documented record shows a world that depends on a handful of platforms and on ageing aviation and grid infrastructure. Accidental config errors cause most mass outages, and criminals and states are raising the cost of the malicious tail. Nothing in the primary evidence supports a WEF- or Gates-scheduled "cyber pandemic". A few days of household supplies is ordinary, long-planned resilience advice, and it fits the measured risks.

## Sources
1. [Prepping for a 'cyber pandemic'](https://sociable.co/technology/prepping-cyber-pandemic-cyber-polygon-stage-supply-chain-attack-simulation/) — The Sociable, 2021-02-10 · web
2. [Cyber Polygon looks at ways to forge a secure digital future](https://www.euronews.com/2020/07/15/cyber-polygon-looks-at-ways-to-forge-a-secure-digital-future) — Euronews, 2020-07-15 · news
3. [Cyber Polygon 2020 agenda (Schwab "Welcoming Remarks", YouTube EOvz1Flfrfw)](https://2020.cyberpolygon.com/agenda/) — Cyber Polygon / BI.ZONE, 2020 · youtube
4. [Cyber Polygon 2020 ends in success](https://cyberpolygon.com/news/cyber-polygon-2020-international-online-exercise-ends-in-success/) — Cyber Polygon, 2020 · official
5. [Fact Check: Schwab/WEF NOT planning major cyberattack](https://leadstories.com/hoax-alert/2023/01/fact-check-klaus-schwab-world-economic-forum-not-planning-major-cyberattack.html) — Lead Stories, 2023-01-13 · web
6. [Schwab cyber attack](https://www.mimikama.org/en/schwab-cyberangriff/) — Mimikama (snippet only) · web
7. [Cyber Polygon 2021 results](https://cyberpolygon.com/results-2021/) — Cyber Polygon, 2021 · official
8. [Cyber Polygon 2021 scenarios](https://2021.cyberpolygon.com/scenarios/) — Cyber Polygon, 2021 · official
9. [This WEF video doesn't prove any conspiracy](https://politifact.com/factchecks/2023/sep/15/facebook-posts/this-world-economic-forum-video-doesnt-prove-any-c/) — PolitiFact, 2023-09-15 · web
10. [Fact check: WEF chairman cyber attack video](https://checkyourfact.com/2023/01/17/fact-check-wef-chairman-cyber-attack-video) — CheckYourFact, 2023-01-17 (body not loaded) · web
11. [Cyber insecurity and misinformation top WEF global risk list](https://www.infosecurity-magazine.com/news/top-wef-global-risk-list-2024-cyber) — Infosecurity Magazine, 2024-01-10 · news
12. [Global Risks 2025: a world of growing divisions](https://www.weforum.org/publications/global-risks-report-2025/in-full/global-risks-2025-a-world-of-growing-divisions-c943fe3ba0) — WEF, 2025-01 (snippet) · official
13. [Global Risks Report 2026 press release](https://www.weforum.org/press/2026/01/global-risks-report-2026-geopolitical-and-economic-risks-rise-in-new-age-of-competition/) — WEF, 2026-01-14 (snippet) · official
14. [Cyber fraud, not ransomware, is now businesses' top concern](https://securityboulevard.com/2026/01/cyber-fraud-not-ransomware-is-now-businesses-top-security-concern/) — Security Boulevard, 2026-01 · news
15. [Bill Gates TED Talk transcript 2015](https://www.rev.com/blog/transcripts/bill-gates-ted-talk-transcript-from-2015-warns-of-pandemics-epidemics) — Rev · web
16. [Bill Gates's new message about AI doom](https://gizmodo.com/bill-gatess-new-message-about-ai-doom-isnt-what-you-might-think-it-is-2000819208) — Gizmodo, 2026-09-30 · news
17. [Bill Gates's Blunt Warning on A.I. (transcript)](https://podscripts.co/podcasts/the-ezra-klein-show/bill-gatess-blunt-warning-on-ai) — Ezra Klein Show via Podscripts, 2026-09-29 · youtube
18. [Bill Gates warns cyberattacks most imminent AI threat](https://www.thestar.com.my/tech/tech-news/2026/10/12/bill-gates-warns-cyberattacks-most-imminent-ai-threat) — AFP via The Star, 2026-10-12 · news
19. [Bill Gates sounds alarm on AI-powered cyberattacks](https://www.wfmd.com/2026/10/11/bill-gates-sounds-alarm-on-ai-powered-cyberattacks-warns-of-negative-surprises-within-a-year/) — WFMD/Fox, 2026-10-11 · news
20. [Bill Gates says we may suffer…](https://www.yahoo.com/news/us/articles/bill-gates-says-may-suffer-230006029.html) — Yahoo/Benzinga (CBS Evening News), 2026-09 · news
21. [Online conspiracy theories abound after major global IT crash](https://www.france24.com/en/technology/20240720-online-conspiracy-theories-abound-after-major-global-it-crash) — AFP via France24, 2024-07-20 · news
22. [Event 201 rehearsed a pandemic. Cyber Polygon rehearsed…](https://therealanalytics.substack.com/p/event-201-rehearsed-a-pandemic-cyber) — "The Unseen Pattern" Substack, 2026-10-26 · forums
23. [NCSC Annual Review 2025 — incident management](https://www.ncsc.gov.uk/collection/ncsc-annual-review-2025/chapter-01-cyber-threat-to-the-uk/incident-management) — NCSC, 2025-10 · official
24. [ENISA Threat Landscape 2025 (v1.2)](https://www.enisa.europa.eu/sites/default/files/2026-01/ENISA%20Threat%20Landscape%202025_v1.2.pdf) — ENISA, 2025-10/2026-01 · official
25. [Uptime Annual Outage Analysis 2026](https://itweb.africa/article/uptime-announces-annual-outage-analysis-report-2026/WnxpEv4Y6837V8XL) — Uptime via ITWeb, 2026-05-13 · academic
26. [Uptime Annual Outage Analysis 2025](https://www.silicon.co.uk/press-release/uptime-announces-annual-outage-analysis-report-2025) — Uptime via Silicon, 2025-05-06 · academic
27. [Cloud services see decline in downtime in 2025](https://www.businessinsurance.com/cloud-services-see-decline-in-downtime-in-2025-parametrix/) — Business Insurance (Parametrix), 2026-03-30 · academic
28. [Dragos 2026 OT Cybersecurity Year in Review](https://www.dragos.com/blog/dragos-2026-ot-cybersecurity-year-in-review) — Dragos, 2026-02-17 · academic
29. [GFSR April 2024, Chapter 3 summary](https://www.imf.org/-/media/files/publications/gfsr/2024/april/english/ch3sum.pdf) — IMF, 2024-04 · academic
30. [Rising cyber threats pose serious concerns for financial stability](https://www.imf.org/en/Blogs/Articles/2024/04/09/rising-cyber-threats-pose-serious-concerns-for-financial-stability) — IMF blog, 2024-04-09 · academic
31. [Analyzing third party service dependencies in modern web services](https://par.nsf.gov/biblio/10316481) — Kashaf, Sekar, Agarwal, IMC 2020 · academic
32. [Business Blackout](https://www.lloyds.com/news-and-risk-insight/press-releases/2015/07/business-blackout) — Lloyd's, 2015-07-08 · academic
33. [Failure of a top cloud provider could cost US economy $15bn](https://www.lloyds.com/insights/media-centre/press-releases/failure-of-a-top-cloud-service-provider-could-cost-us-economy-15-billion-dollars) — Lloyd's, 2018-01-23 · academic
34. [System failures driving ICT disruptions in EU financial sector](https://www.fow.com/insights/system-failures-driving-ict-disruptions-in-eu-financial-sector-dora-review) — FOW, 2026-06 · academic
35. [ESAs issue first report on DORA major ICT incidents](https://www.regulationtomorrow.com/2026/06/esas-issue-first-report-on-dora-major-ict-related-incidents/) — Regulation Tomorrow, 2026-06 · academic
36. [Channel File 291 Root Cause Analysis](https://www.crowdstrike.com/wp-content/uploads/2024/08/Channel-File-291-Incident-Root-Cause-Analysis-08.06.2024.pdf) — CrowdStrike, 2024-08-06 · official
37. [CrowdStrike outage: Fortune 500 $5.4bn](https://fortune.com/2024/08/03/crowdstrike-outage-fortune-500-companies-5-4-billion-damages-uninsured-losses) — Fortune, 2024-08-03 · news
38. [Summary of the Amazon DynamoDB service disruption](https://aws.amazon.com/message/101925/) — AWS, 2025-10 · official
39. [Largest outages of 2025 (Ookla)](https://www.fonearena.com/blog/471254/largest-outages-2025-ookla.html/amp) — FoneArena, 2025-12 · news
40. [Cloudflare outage on 18 November 2025](https://blog.cloudflare.com/18-november-2025-outage/) — Cloudflare · official
41. [Cloudflare outage on 5 December 2025](https://blog.cloudflare.com/5-december-2025-outage/) — Cloudflare · official
42. [Google Cloud incident ow5i3PPK96RduMcb1SsW](https://status.cloud.google.com/incidents/ow5i3PPK96RduMcb1SsW) — Google, 2025-06-12 · official
43. [Verizon says major outage caused by software issue](https://broadbandbreakfast.com/verizon-says-major-outage-caused-by-software-issue/) — Broadband Breakfast, 2026-01 · news
44. [Amazon outages in the Middle East](https://www.theregister.com/2026/03/02/amazon_outages_middle_east/) — The Register, 2026-03-02 · news
45. [Ransomware attack disrupts Japan's IDCF Cloud](https://www.bleepingcomputer.com/news/security/ransomware-attack-disrupts-japans-idcf-cloud-used-by-govt-clients/) — BleepingComputer, 2026-10-08 · news
46. [NVD API: CVE-2026-109618](https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2026-109618) — NIST NVD · official
47. [NVD API: CVE-2026-109619](https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2026-109619) — NIST NVD · official
48. [Critical vulnerabilities in PHP require immediate patching](https://www.cisa.gov/news-events/alerts/2026/10/21/critical-vulnerabilities-php-require-immediate-patching) — CISA, 2026-10-21 · official
49. [Today's PHP security release…](https://thephp.foundation/blog/2026/10/21/todays-php-security-release-and-how-were-strengthening-php-security/) — PHP Foundation, 2026-10-21 · official
50. [Amazon identifies PHP2Shell exploitation prior to disclosure in MadPot](https://aws.amazon.com/blogs/security/amazon-threat-intelligence-identifies-php2shell-exploitation-prior-to-public-disclosure-in-madpot/) — AWS Security Blog, 2026-10-21 · official
51. [PHP2Shell FAQ](https://www.tenable.com/blog/php2shell-cve-2026-109618-cve-2026-109619-frequently-asked-questions-about-critical-php-remote) — Tenable, 2026-10 · web
52. [Widespread PHP flaw may cause many site outages today](https://krebsonsecurity.com/2026/10/widespread-php-flaw-may-cause-many-site-outages-today/) — KrebsOnSecurity, 2026-10 · news
53. [Threat brief: CVE-2026-109618 / -109619 (Oct 25 retraction)](https://unit42.paloaltonetworks.com/cve-2026-109618-cve-2026-109619/) — Palo Alto Unit 42, 2026-10-25 · official
54. [PHP2Shell: the 14-year-old bugs that pulled cyber.gov.au offline](https://itwire.com/business-it-news/security/php2shell-the-14-year-old-bugs-that-pulled-cyber-gov-au-and-government-sites-worldwide-offline) — iTWire, 2026-10 · news
55. [PHP2Shell forces thousands of Nepali websites offline](https://kathmandupost.com/science-technology/2026/10/25/php2shell-security-flaw-forces-thousands-of-nepali-websites-offline) — Kathmandu Post, 2026-10-25 · news
56. [PHP2Shell exposes the weakness in coordinated disclosure](https://www.csoonline.com/article/4239359/php2shell-exposes-the-weakness-in-coordinated-vulnerability-disclosure-2.html) — CSO, 2026-10 · news
57. [NVD API: CVE-2024-4577](https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2024-4577) — NIST NVD · official
58. [M&S cyberattack hit to profits £300m](https://therecord.media/marks-spencer-cyberattack-hit-to-profits-300m) — The Record, 2025-05-21 · news
59. [Co-op confirms data of 6.5 million members stolen](https://www.bleepingcomputer.com/news/security/co-op-confirms-data-of-65-million-members-stolen-in-cyberattack/) — BleepingComputer, 2025-07-16 · news
60. [JLR cyberattack economic impact](https://therecord.media/jaguar-land-rover-cyberattack-economic-impact) — The Record, 2025-10-22 · news
61. [NCA arrest four for attacks on M&S, Co-op and Harrods](https://nationalcrimeagency.gov.uk/news/retail-cyber-attacks-nca-arrest-four-for-attacks-on-m-s-co-op-and-harrods) — NCA, 2025-07-10 · official
62. [28 April 2025 Iberian blackout](https://www.entsoe.eu/publications/blackout/28-april-2025-iberian-blackout/) — ENTSO-E · official
63. [Final report press briefing deck](https://eepublicdownloads.blob.core.windows.net/public-cdn-container/clean-documents/Publications/2025/iberian-blackout/260318_Final%20report_press%20briefing%20PPT_Final.pdf) — ENTSO-E, 2026-03-20 · official
64. [Spain blackout report](https://www.nbcnews.com/news/amp/rcna213672) — NBC News, 2025-06-17 · news
65. [El informe del Gobierno sobre el apagón… descarta un ciberataque](https://www.infobae.com/espana/2025/06/17/el-informe-del-gobierno-sobre-el-apagon-del-28-de-abril-recalca-un-origen-multifactorial-del-cero-energetico-y-descarta-un-ciberataque/) — Infobae, 2025-06-17 · news
66. [ENTSO-E report finds systemic failures](https://www.pv-magazine.com/2026/03/23/entso-e-report-finds-systemic-failures-behind-2025-iberian-blackout/) — pv magazine, 2026-03-23 · news
67. [A faulty solar inverter crashed the Spanish grid](https://watt-logic.com/2025/07/16/voltage-inertia-and-the-iberian-blackout-part-2-a-faulty-solar-inverter-crashed-the-spanish-grid12088/) — Watt-Logic (K. Porter), 2025-07-16 · forums
68. [The Iberian Blackout: A Black Swan or a Gray Rhino?](https://arxiv.org/abs/2511.17433) — Albustami & Taha, arXiv 2511.17433 · academic
69. [NESO final report: North Hyde substation outage](https://www.neso.energy/national-energy-system-operator-publishes-final-report-review-north-hyde-substation-outage) — NESO, 2025-07-02 · official
70. [Investigation into NGET re North Hyde](https://www.ofgem.gov.uk/cy/publications/investigation-national-grid-electricity-transmission-plc-and-its-compliance-obligations-under-section-92-electricity-act-1989-and-slc-b71-its-electricity-transmission-licence-relation-north-hyde-substation) — Ofgem · official
71. [Incident report: energy sector 2025](https://cert.pl/en/posts/2026/01/incident-report-energy-sector-2025/) — CERT Polska, 2026-01-30 · official
72. [Poland power grid attack: ELECTRUM](https://www.dragos.com/blog/poland-power-grid-attack-electrum-targets-distributed-energy-2025) — Dragos · academic
73. [Wiper attack on Polish power grid](https://www.infosecurity-magazine.com/news/wiper-attack-polish-power-grid/) — Infosecurity Magazine · news
74. [Poland cyberattack on grid: Russia](https://therecord.media/poland-cyberattack-grid-russia) — The Record, 2026-01 · news
75. [Berlin power outage: Vulkangruppe arson](https://www.cbsnews.com/news/berlin-power-outage-vulkangruppe-left-wing-arson-attack-called-terrorism/) — CBS News, 2026-01 · news
76. [Cyber attack downs 30+ water utilities](https://natlawreview.com/article/cyber-attack-downs-more-30-water-utilities-simultaneously) — National Law Review, 2026-07 · news
77. [Maduro raid had telltale signs of a cyber-enabled blackout](https://www.axios.com/2026/01/08/venezuela-maduro-raid-blackout-cyber-operation) — Axios, 2026-01-08 · news
78. [Sweden closes Baltic cable investigation: accident](https://gcaptain.com/sweden-close-baltic-sea-cable-damage-investigation-ruling-accident-not-sabotage/) — gCaptain, 2025-10-14 · news
79. [AA24-038A: PRC state-sponsored actors pre-position](https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-038a) — CISA, 2024-02-07 · official
80. [AA25-239A: Salt Typhoon](https://www.cisa.gov/news-events/cybersecurity-advisories/aa25-239a) — CISA, 2025-08-27 · official
81. [Nine US telecoms hacked by Salt Typhoon](https://therecord.media/nine-us-companies-hacked-salt-typhoon-china-espionage) — The Record, 2024-12-27 · news
82. [Annual Threat Assessment 2026](https://archive.dni.gov/files/ODNI/documents/assessments/ATA-2026-Unclassified-Report.pdf) — ODNI, 2026-03 · official
83. [GCHQ Annual Lecture 2026](https://www.gchq.gov.uk/speech/gchq-annual-lecture-2026-as-delivered) — GCHQ, 2026-05-27 · official
84. [Why Russia could escalate hybrid warfare against Europe](https://carnegieendowment.org/europe/strategic-europe/2026/07/why-russia-could-escalate-hybrid-warfare-against-europe) — Carnegie Europe, 2026-07-21 · web
85. [Preparedness](https://commission.europa.eu/topics/preparedness_en) — European Commission · official
86. [Resilience Action Plan written statement](https://questions-statements.parliament.uk/written-statements/1820582) — UK Parliament, 2025-07 · official
87. [National Risk Register 2025](https://assets.publishing.service.gov.uk/media/6787ea8e1124a2c3ceb646bf/National_Risk_Register_2025.pdf) — Cabinet Office · official
88. [A Guide to the 2026 National Risk Register](https://assets.publishing.service.gov.uk/media/6a50d68d9e9c95844ae64caf/A_Guide_to_the_2026_National_Risk_Register.pdf) — Cabinet Office, 2026-07-14 · official
89. [Households encouraged to take small, simple steps…](https://www.gov.uk/government/news/households-encouraged-to-take-small-simple-steps-to-stay-prepared-in-an-emergency) — Cabinet Office, 2026-10-22 · official
90. [Be Ready](https://beready.campaign.gov.uk/) — HM Government · official
91. [UK Public Survey of Risk Perception… 2025](https://www.gov.uk/government/statistics/uk-public-survey-of-risk-perception-resilience-and-preparedness-2025/uk-public-survey-of-risk-perception-resilience-and-preparedness-2025-headline-findings) — Cabinet Office (snippet) · official
92. [Beans, water and radios sell out](https://thenationalnews.com/news/uk/2026/10/27/beans-water-and-radios-sell-out-after-uks-stockpile-warning) — The National, 2026-10-27 · news
93. [Don't panic: UK govt tells Britons to be ready](https://www.arabnews.pk/world/dont-panic-uk-govt-tells-britons-to-be-ready-for-emergencies-3005067) — Arab News, 2026-10-23 · news
94. [Denk vooruit](https://www.denkvooruit.nl/) — Dutch government · official
95. [Emergency advice booklets to be distributed](https://www.irishtimes.com/ireland/2026/08/28/emergency-advice-booklets-to-be-distributed-to-households/) — Irish Times, 2026-08-28 · news
96. [Build a kit](https://www.ready.gov/kit) — Ready.gov · official
97. [GAO-26-108427 FEMA workforce](https://www.gao.gov/products/gao-26-108427) — GAO, 2026-08-04 · official
98. [Trump proposes cutting CISA election security program](https://www.nextgov.com/cybersecurity/2026/04/trump-proposes-cutting-cisa-election-security-program-fy27-budget/412672/) — Nextgov, 2026-04 · news
99. [Electricity System Restoration Standard](https://www.neso.energy/industry-information/balancing-services/electricity-system-restoration-standard) — NESO · official
100. [UK arrests suspect for RTX ransomware attack](https://www.bleepingcomputer.com/news/security/uk-arrests-suspect-for-rtx-ransomware-attack-causing-airport-disruptions/) — BleepingComputer, 2025-09-24 · news
101. [Airport cyberattack disrupts flights in Europe](https://www.nbcnews.com/world/europe/airport-cyberattack-disrupts-flights-europe-rcna232743) — NBC/AP, 2025-09-22 · news
102. [NCA arrest — HardBit ransomware](https://www.infosecurity-magazine.com/news/nca-arrest-hardbit-ransomware/) — Infosecurity Magazine, 2025-09 · news
103. [Lessons from the European airports ransomware attack](https://www.lawfaremedia.org/article/lessons-from-the-european-airports-ransomware-attack) — Lawfare · web
104. [CAA publishes independent review of Aug 2023 NATS failure](https://www.caa.co.uk/newsroom/news/aviation-regulator-publishes-independent-review-into-august-2023-nats-flight-planning-system-failure/) — UK CAA, 2024-11-14 · official
105. [CAA scope of review into NATS incident on 8 Sep 2026](https://www.caa.co.uk/newsroom/news/uk-aviation-regulator-announces-scope-of-independent-review-into-nats-technical-incident-on-8-september-2026/) — UK CAA, 2026-09 · official
106. [UK air traffic control outage caused by software defect](https://cyprus-mail.com/2026/09/18/uk-air-traffic-control-outage-caused-by-software-defect) — Reuters via Cyprus Mail, 2026-09-18 · news
107. [Information request letter regarding NOTAM system outages](https://www.duckworth.senate.gov/download/information-request-letter-regarding-notam-system-outages&download=1) — US Senate (Duckworth), 2025-04-03 · official
108. [Newark airport ground stop: equipment issues](https://www.nbcnewyork.com/new-jersey/newark-airport-ground-stop-equipment-issues/6550060/) — NBC New York, 2026-09-21 · news
109. [Hundreds of flights impacted over equipment failure](https://www.newsweek.com/hundreds-of-flights-impacted-at-major-us-airports-over-equipment-failure-12469404) — Newsweek, 2026-09-21 · news
110. [$30B more needed for ATC modernization](https://www.nextgov.com/modernization/2026/09/30b-more-needed-air-traffic-control-modernization-transportation-secretary-says/416324/) — Nextgov, 2026-09-29 · news
111. [GAO-26-107992](https://www.gao.gov/products/gao-26-107992) — GAO, 2026-09-14 · official
112. [Flights grounded in Midwest after Minnesota ATC outage](https://abcnews.com/US/flights-grounded-midwest-after-temporary-outage-minnesota-air/story?id=135438785) — ABC News, 2026-08-06 · news
113. [Port of Seattle says 90,000 impacted](https://therecord.media/port-of-seattle-says-90000-impacted-in-2024-ransomware-attack) — The Record, 2025-04 · news
114. [Alaska statement on IT outage](https://news.alaskaair.com/on-the-record/alaska-statement-on-it-outage/) — Alaska Airlines, 2025-10 · official
115. [Alaska Airlines requests system-wide ground stop](https://www.cbsnews.com/news/alaska-airlines-requests-system-wide-ground-stop-due-to-it-outage) — CBS News, 2025-07-21 · news
116. [American Airlines IT outage triggers ground stop](https://www.techtimes.com/articles/321944/20260729/american-airlines-it-outage-triggers-third-faa-ground-stop-two-years.htm) — Tech Times, 2026-07-29 · news
117. [Danish PM calls drone flights most serious attack](https://www.thelocal.dk/20250923/danish-pm-calls-drone-flights-most-serious-attack-on-countrys-infrastructure) — The Local, 2025-09-23 · news
118. [Fact-checking Europe's drone problem](https://www.euronews.com/2025/11/20/fact-checking-europes-drone-problem-why-are-airports-shuttering-over-drone-sightings) — Euronews, 2025-11-20 · news
119. [Russia behind drone incident at Leipzig airport](https://www.euronews.com/my-europe/2026/09/01/russia-behind-drone-incident-at-leipzig-airport-berlin-says) — Euronews, 2026-09-01 · news
120. [UK military sites see near-daily drone incidents in 2026](https://kyivindependent.com/uk-military-sites-see-near-daily-drone-incidents-in-2026-as-europe-confronts-widening-hybrid-threat/) — Kyiv Independent, 2026-09 · news
121. [EASA updates SIB on GNSS interference](https://www.easa.europa.eu/en/newsroom-and-events/news/easa-updates-safety-information-bulletin-gnss-interference) — EASA, 2026-07-03 · official
122. [The epidemic of GPS jamming](https://foreignpolicy.com/2026/06/01/gps-jamming-hormuz-russia-baltic-aviation-shipping-trade/) — Foreign Policy, 2026-06-01 · news
123. [Lithuania records 300 cases of GPS jamming in one month](https://www.lrt.lt/en/news-in-english/19/2525356/lithuania-records-300-cases-of-gps-jamming-in-one-month) — LRT, 2025-03-31 · news
124. [Cyberattack triggers April 2026 chaos at European airports](https://www.thetraveler.org/cyberattack-triggers-major-april-2026-chaos-at-european-airports/) — thetraveler.org (unsourced blog) · web
125. [PHP2Shell: AI uncovers critical RCE in PHP](https://news.ycombinator.com/item?id=50180836) — Hacker News, 2026-10-21 · forums
126. [Cloudflare 18 Nov 2025 post-mortem thread](https://news.ycombinator.com/item?id=45973709) — Hacker News · forums
127. [AWS multiple services outage in us-east-1](https://news.ycombinator.com/item?id=45640838) — Hacker News, 2025-10-20 · forums
128. [Palo Alto retracts claim of PHP2Shell exploitation](https://news.ycombinator.com/item?id=50236839) — Hacker News, 2026-10-25 · forums
129. [Someone knew about PHP's critical flaws four days before…](https://www.reddit.com/r/cybersecurity/comments/1xckw05/someone_knew_about_phps_critical_flaws_four_days/) — r/cybersecurity, 2026-10-22 · reddit
130. [Any actual breaches due to php2shell?](https://www.reddit.com/r/sysadmin/comments/1xdicjj/) — r/sysadmin, 2026-10-23 · reddit
131. [Why 3 days?](https://www.reddit.com/r/UKPreppers/comments/1xffn1t/why_3_days/) — r/UKPreppers, 2026-10-25 · reddit
132. [UK must prepare for infrastructure attacks, says Streeting](https://www.reddit.com/r/unitedkingdom/comments/1xckw1d/) — r/unitedkingdom, 2026-10-22 · reddit
133. [Hot take: everyone going down at once is the problem](https://www.reddit.com/r/sysadmin/comments/1p0g2c7/) — r/sysadmin, 2025-11-18 · reddit
134. [Cyber polygon 10/26](https://www.reddit.com/r/conspiracy/comments/1xe9a6y/cyber_polygon_1026/) — r/conspiracy, 2026-10-24 · reddit
135. [Air traffic control issue disrupts UK airports](https://www.reddit.com/r/unitedkingdom/comments/1warn6o/) — r/unitedkingdom, 2026-09-08 · reddit
136. [Pour one out for whoever pushed that CrowdStrike update](https://www.reddit.com/r/sysadmin/comments/1e6xmve/) — r/sysadmin, 2024-07-19 · reddit
137. ["It's predictive programming" — Leave the World Behind](https://www.youtube.com/watch?v=VxkRAm8mvhg) — Valuetainment · youtube
138. [Stockpiling: Britons urged to prepare](https://www.youtube.com/watch?v=8VxvMlMjUNU) — 5 News, 2026-10 · youtube
139. [FAA NOTAM outage: files deleted](https://www.npr.org/2023/01/19/1150196884/faa-notam-flights-deleted-files) — NPR, 2023-01-19 (503 to fetcher; facts corroborated by wire snippets) · news

---

## Appendix: claim → status → source

Status key: **V** = VERIFIED · **C** = CORRECTED · **U** = UNVERIFIABLE · **F** = FALSE. "(snip)" means the claim was confirmed from a search snippet or a secondary report only, not from an opened primary page.

### A. WEF / Gates
| # | Claim | Status | Correct value / note | Src |
|---|---|---|---|---|
| 1 | Schwab Cyber Polygon quote (Jul 2020) | **V** | Exact wording confirmed. Date 8 Jul 2020. Original on BI.ZONE YouTube (EOvz1Flfrfw); runtime not readable. Use the non-AMP Sociable URL; the /amp one serves another page. | [1][2][3] |
| 2 | Viral clip = 35 s of 11+ min speech | **V/U** | 35 s confirmed by Lead Stories. "11+ min" is Mimikama (snip). CheckYourFact says ~10 min. | [5][6][10] |
| 3 | CP2021: supply-chain, 200 teams/48 countries, BI.ZONE, Mishustin, INTERPOL | **V** | 9–10 Jul 2021. INTERPOL's Jürgen Stock spoke. | [7][8] |
| 4a | WEF video still live? | **U** | Dated 18 Jan 2021. Embedded per PolitiFact (2023). weforum.org returned 403 and no archive was reachable. Sociable says unlisted on YouTube. | [9][1] |
| 4b | Jurgens: "faster and further than any biological virus" | **C** | The wording is "faster and **farther**", and it is the WEF's narration, not Jurgens. His real line: "it will be faster than what we've seen with COVID… the exponential growth rate will be much steeper". | [1][9] |
| 5a | Lead Stories | **V** | Rated false/hoax, 13 Jan 2023 | [5] |
| 5b | CheckYourFact | **V (snip)** | 17 Jan 2023. Misleading / out of context. | [10] |
| 5c | PolitiFact | **V** | False, 15 Sep 2023. Also False (19 Jul 2024) that Gates caused CrowdStrike. | [9] |
| 5d–e | Logically Facts / Logically | **U** | Pages dead (DNS failure / 404). "False" per snippet only. | — |
| 5f | Reuters/AFP/Snopes check | **V (none exist)** | No Cyber Polygon check found. AFP covered the 2024 #cyberpolygon surge as a news story. | [21] |
| 6a | GRR 2024: misinformation #1, cyber #4 (2-yr) | **V** | — | [11] |
| 6b | GRR 2025: cyber espionage/warfare #5 | **V** | Two-year horizon | [12] |
| 6c | GRR 2026: geoeconomic #1; cyber #9 current, #6 two-year | **V (snip)** | Both rankings confirmed | [13] |
| 7 | GCO 2026: 804/92; 94%; 87%; 66%; 31%; 73%; CEOs fraud>ransomware | **V except 66%** | **66% → 64%** (definition varies). 31% is up from 26%. 73% means "self or network". CISOs still rank ransomware first. | [14] |
| 8 | Gates TED 2015 quote | **V** | Exact | [15] |
| 9a | Gates ABC ~11 Oct 2026 | **V quote / venue disputed** | Sunday 11 Oct. AFP says ABC; Fox News, IBTimes UK and TMZ say CNN *State of the Union*. | [18][19] |
| 9b | Ezra Klein quote | **V** | Episode 29 Sep 2026, ~12:00. Gizmodo covered it 30 Sep. | [16][17] |
| 9c | CBS "may have to suffer" | **V** | CBS Evening News (Tony Dokoupil), Sep 2026: "it may be that we have to suffer a few of the negatives…" | [20] |
| 10a | AFP #cyberpolygon surge | **V** | 20 Jul 2024 | [21] |
| 10b | Max Blumenthal X post | **U** | Could not be opened (xcancel 451; archive blocked) | — |
| 10c | Substack Event 201→CP→72 h | **V** | 26 Oct 2026. Insinuation, no evidence. | [22] |
| 10d | "Leave the World Behind" predictive programming | **V (as a claim circulating)** | ~1.05M-view Valuetainment video. No formal fact-check found. | [137] |

### B. IT / cloud
| # | Claim | Status | Correct value / note | Src |
|---|---|---|---|---|
| 11a | CF291, 21 vs 20 fields, Content Validator | **V** | Quoted from the RCA | [36] |
| 11b | Microsoft: 8.5M devices, <1% | **V (snip)** | — | — |
| 11c | "This was not a cyberattack." | **C** | Kurtz: "not a security incident or cyberattack" (snip) | — |
| 11d | Parametrix $5.4B, 10–20% insured | **V** | — | [37] |
| 11e | Delta ~7,000 cancellations, ~$500M | **C / V** | Most sources say **>5,000** cancellations. ~$500M verified. | [37] |
| 11f | DOT closed Delta probe Jun 2026 | **V (snip)** | Closed ~Nov 2025, reported mid-Jun 2026, no penalty (WALB). The AJC link returns 404. | — |
| 11g | Delta v CrowdStrike status | **U** | Ongoing in Fulton County. No 2026 ruling found. | — |
| 11h | CrowdStrike 8-K ~16 Oct 2026 | **U** | Not found; latest found is 26 Aug 2026 | — |
| 12a | AWS race condition, empty DNS record, 2:25 AM | **V** | — | [38] |
| 12b | Full recovery 2–3 PM PDT | **V** | 2:20 PM. Some Redshift clusters until 04:05 on 21 Oct. | [38] |
| 12c | 17M outage reports | **V** | Ookla/Downdetector | [39] |
| 12d | ~3,500 companies / 60 countries | **U (likely F)** | Sources say "over 2,500 companies" | — |
| 13 | Cloudflare 18 Nov: permissions, >200 vs ~60, 11:20–17:06, "not… cyber attack" | **V** | Timeline table starts at 11:28 | [40][126] |
| 14 | Cloudflare 5 Dec: ~25 min, 28%, React2Shell | **V** | 08:47–09:12 UTC | [41] |
| 15a | Azure Front Door 29 Oct 2025 | **V (snip)** | Inadvertent config change deployed past a defect in the deployment safety systems | — |
| 15b | Google Cloud 12 Jun 2025 | **V** | Service Control null pointer, no feature flag | [42] |
| 15c | Verizon Jan 2026 | **V** | 14 Jan, "software issue", no sign of cyber | [43] |
| 15d | AWS ME drone strikes quote | **C** | Event verified. The article paraphrases AWS saying two UAE facilities were "directly struck" and Bahrain was hit "in close proximity". | [44] |
| 15e | AWS us-east-1 28-h cooling failure May 2026 | **C (snip)** | 7 May 2026 thermal event in use1-az4. Duration 19–28 h is disputed. | — |
| 15f | IDC Frontier ransomware Oct 2026 | **V** | 7 Oct 2026, 495 customers, company-confirmed ransomware | [45] |
| 16a | CVE-2026-109618/-109619 exist | **V** | NVD and CISA; KEV 26 Oct | [46][47][48] |
| 16b | CVSS v4 9.2 / NVD 3.1 9.8 | **C** | 109618 = 9.8; **109619 = 8.1**. v4 9.2 for both. Leaked IDs carried a wrong 10.0. | [46][47][49] |
| 16c | Patched 8.5.12/8.4.27/8.3.36/8.2.35; ≤8.1 unpatched | **V** | 7.4–8.1 get source backports only | [48][51] |
| 16d | ~14-year-old bugs | **V (as claim)** | Earliest code path is PHP 5.4.0 (2012). NVD CPE range starts at 7.3.0. | [51][54] |
| 16e | Calif/LCFR + GPT-5.6 Sol; OpenAI & Wiz independently | **V** | GPT-5.6 Sol attribution comes from OpenAI via an aggregator | [49][51] |
| 16f | IDs + PoC leaked 20 Oct; release pulled forward | **V** | PoC video was Calif's own mistaken post. Release moved from 22 to 21 Oct. | [49] |
| 16g | "structural failure"; Chainguard broke embargo | **V** | Chainguard images published 21 Oct 07:41 UTC | [49][56] |
| 16h | MadPot attempt 17 Oct | **V** | — | [50] |
| 16i | CISA alert 21 Oct, KEV ~26 Oct | **V** | — | [48] |
| 16j | Takedowns (NL, BE, FI, FR, DE, CZ, AU, Nepal, Wikimedia) | **V mostly** | AU, FR, FI, DK, NL, Port of Rotterdam, Wikipedia systems and Nepal opened. BE/DE (snip). **Czechia U.** | [54][55] |
| 16k | Unit 42: EU gov entity lost hashes and MFA secrets | **F (retracted)** | Unit 42's 23 Oct update was retracted 25 Oct: "unable to confirm that initial access is associated with the specific PHP2Shell CVEs". The page has no hashes/MFA text. | [53][128] |
| 16l | Exposure 1.3M / 2.58M / 22M / 70% | **C** | 1.3M (Cutler) and 2.58M (Censys) are host counts. **22.6M** is Unit 42 "potentially vulnerable instances". 70% is W3Techs' usage share (69.3%), not exposure. Best estimate: **~1.3–2.6M exposed hosts**. | [51][52][53] |
| 16m | CVE-2024-4577 alternative | **V** | PHP-CGI on Windows; 9.8; KEV 12 Jun 2024. It is a separate event; "PHP mass outage" in Oct 2026 refers to PHP2Shell. | [57] |
| 17a | M&S ~£300M; DragonForce/Scattered Spider | **V** | Before mitigation and insurance | [58] |
| 17b | Co-op 6.5M | **V** | All 6.5M members. Contact and identity data only. | [59] |
| 17c | JLR £1.9bn; most damaging; 5,000+ orgs; £1.5bn guarantee | **V** | Guarantee announced 28 Sep 2025 (UKEF) | [60] |
| 17d | NCA arrests | **V** | 10 Jul 2025, four people (17, 19, 19, 20). No charges found. | [61] |

### C. Grid / physical
| # | Claim | Status | Correct value / note | Src |
|---|---|---|---|---|
| 18a | Spain report: no cyber evidence; overvoltage; planning; disconnections | **V** | "no se han encontrado indicios o evidencias… ciberataque" | [64][65] |
| 18b | ENTSO-E final report 20 Mar 2026, no single cause | **V** | — | [62][63] |
| 18c | 21 vs 22 recommendations | **U** | Press is split (22 per pv-magazine). Officially there are 5 recommendation areas. | [66] |
| 18d | Panel 45 vs 49 | **C → 49** | — | [62][63] |
| 18e | 440–472 pages | **U** | Press is split | [66] |
| 18f | "15 GW / 60% in 5 s" | **U** | Not in ENTSO-E material. Trade press gives a total loss of load over ~90 s. | [63] |
| 18g | "The problem is not renewable energy, but voltage control." | **U** | Not found anywhere | — |
| 18h | ENTSO-E addresses cyber | **U** | Not mentioned on the landing page, press release or slides. The full report (>10 MB) was unread. | [62] |
| 18i | Porter inverter view; arXiv 2511.17433 | **V** | arXiv: "gray rhino" from voltage and protection failures, not cyber | [67][68] |
| 19 | NESO: moisture in bushing; 2018 readings; 12 recs; Met Police nothing suspicious | **V / U** | First three verified. The Met Police line is not on the NESO page (U). Ofgem investigation is open. | [69][70] |
| 20a | Poland ~29 Dec 2025, ~30 sites, DynoWiper, no outage | **V** | "did not affect the ongoing production of electricity" | [71][73] |
| 20b | "very close to a blackout" said by the minister | **C** | It was **Digital Affairs Minister Gawkowski**, 13 Jan 2026. Tusk said infrastructure was not threatened. | [74] |
| 20c | Attribution ESET/Dragos/CERT Polska | **C** | ESET: Sandworm (medium confidence). Dragos: ELECTRUM. CERT Polska points to Static Tundra / Berserk Bear / Dragonfly clusters and does **not** say "FSB" explicitly. | [71][72][73] |
| 21 | Berlin arson 3 Jan 2026, Vulkangruppe, ~45k households | **V** | Plus 2,000+ businesses | [75] |
| 22 | Minnesota 30+ water utilities, unattributed, CISA guidance | **V** | Leaks point to Iran (snip) | [76] |
| 23 | Caracas Jan 2026 possible cyber | **C (reframe)** | Happened during the US raid of 3 Jan 2026. Caine cited Cyber Command "layering different effects". Cyber cause not proven. | [77] |
| 24a | Sweden closed case as accident | **V** | 14 Oct 2025, Vezhen | [78] |
| 24b | Finland Supo Mar 2026 | **U** | Not checked (search budget ran out) | — |
| 24c | Fitburg seized ~31 Dec 2025 | **C** | Intercepted 31 Dec, formally seized 7 Jan 2026, released 12 Jan (snip) | — |

### D. State actors
| # | Claim | Status | Correct value / note | Src |
|---|---|---|---|---|
| 25 | AA24-038A quote; 5+ years | **V** | "for at least five years" | [79] |
| 26 | Salt Typhoon AA25-239A; ≥9 carriers; 2026 advisory | **V / C** | AA25-239A dated 27 Aug 2025 (revised 3 Sep). The "9 carriers" figure comes from a White House call on 27 Dec 2024, not the advisory. 2026 advisories AA26-251A and AA26-281A exist but are not Salt-specific. | [80][81] |
| 27 | ODNI ATA 2026 on Volt/Salt | **C** | Generic language ("most active and persistent"; "pre-position… disruptive and destructive attacks"). Volt and Salt are **not named** in the Cyber section. | [82] |
| 28a | GCHQ "seabed to cyberspace" | **V** | Keast-Butler, 27 May 2026 | [83] |
| 28b | Carnegie fourfold rise | **V (as claim)** | Sourced to The Economist (Jul 2025) | [84] |

### E. Trend data
| # | Claim | Status | Correct value / note | Src |
|---|---|---|---|---|
| 29 | NCSC 429 / 204 (vs 89) / 18 / 0 Cat 1 | **V** | 18 is right; Glasswall's "8" is unsupported. 0 Cat 1 confirmed via secondary sources. | [23] |
| 30 | Uptime: frequency down 4–5 yrs; third-party rising; 57% >$100k | **V / C** | 57% is from the 2026 report; it was 54% in 2025. Fifth year of decline. | [25][26] |
| 31 | ENISA 4,875; DDoS ~77%; ransomware most impactful | **V / C** | 76.7% DDoS. "Most impactful" is a paraphrase, not ENISA's wording. | [24] |
| 32 | Dragos 26 groups; 119 ransomware groups; ~3,300 victims (+49%) | **C** | **+49% is ransomware groups (80→119), not victims** | [28] |
| 33 | Kashaf 89% | **V** | Three authors | [31] |
| 34 | IMF "thus far not systemic"; ≥$2.5B risk risen | **V** | Extreme losses "more than quadrupled since 2017" (blog) | [29][30] |
| 35 | Lloyd's Business Blackout / Cloud Down | **V** | Cloud Down $15bn central estimate ($11–19bn CI) | [32][33] |
| 36a | ESAs 19 CTPPs, Nov 2025 | **V** | 18 Nov 2025 | [35] |
| 36b | 29% of 3,383 major incidents from third parties | **V** | ESA wording is "almost one third". Only ~10% were cyber. | [34][35] |
| 36c | HMT designated AWS/Google/Microsoft/Oracle 10 Jul 2026 | **V (snip)** | In force 13 Jul 2026 | — |

### F. 72-hour preparedness
| # | Claim | Status | Correct value / note | Src |
|---|---|---|---|---|
| 37a | EU "minimum 72 hours" text | **V** | — | [85] |
| 37b | Guidelines published in 2026? | **U (not found)** | Still in preparation per press (snip) | — |
| 38a | McFadden 8 Jul 2025, gov.uk/prepare | **V (snip)** | — | [86] |
| 38b | NRR 2025 grid failure 1–5% | **V** | Catastrophic impact. "Great Britain has never experienced a nationwide loss of power". | [87] |
| 38c | NRR 2026: 95 risks; digital resilience failure citing CrowdStrike; power low/catastrophic | **V** | Published 14 Jul 2026. 87 risks + 8 scenarios. Digital resilience failure rated likelihood 5–25%. | [88] |
| 39a | Be Ready launch, 3 years | **V** | 22 Oct 2026, 500+ partners | [89] |
| 39b | "72 hours" | **C** | Official text says **"3 days"** | [90] |
| 39c | 3 L/day, checklist items | **U (official)** | Secondary sources only | — |
| 39d | "not a warning of an imminent emergency" | **U (official)** | Ministers' "no specific attack" framing is secondary | [93] |
| 39e | Canonical URL | **V** | gov.uk/beready → **beready.campaign.gov.uk** | [90] |
| 39f | Jarvis vs Streeting | **C** | The release quotes **Jarvis only**. Streeting's "alert but not alarmed" is from press (Arab News). | [89][93] |
| 39g | 13% well prepared | **V (snip)** | 2025 UK preparedness survey, n=10,536 | [91] |
| 39h | Sell-outs | **V** | Partly driven by that weekend's storms | [92] |
| 40a | NL Denk vooruit 8.5M households | **V / U** | Booklet delivered 25 Nov–18 Dec 2025, "72 uur". The 8.5M count is U. | [94] |
| 40b | Sweden MSB ~1 week | **U** | — | — |
| 40c | Germany BBK | **C (snip)** | Minimum 3, up to 10 days | — |
| 40d | Ireland booklets Aug 2026 | **C** | 2.2M booklets delivered from 21 Sep 2026 (announced 28 Aug) | [95] |
| 41a | Ready.gov wording | **V** | "several days" | [96] |
| 41b | GAO-26-108427: separations +55%; surge 600→240 | **V / U** | +55% verified. 600→240 not found. | [97] |
| 41c | FEMA Review Council 7 May 2026 | **V (snip)** | 10 recommendations | — |
| 41d | CISA ~1/3 staff; FY27 −$495M; CISA 2015 lapse | **C** | Nextgov: ~$700M in programs cut, net ~$360M, ~867 positions. CISA 2015 Act extended to 30 Sep 2026; status after that is U. | [98] |
| 42 | NESO ESRS 60%/24h, 100%/5d by 31 Dec 2026; on track? | **V / U** | Targets verified. NESO does not say whether it is on track. | [99] |

### G. Aviation
| # | Claim | Status | Correct value / note | Src |
|---|---|---|---|---|
| 43a | Collins MUSE 19 Sep 2025; LHR, BRU, BER, DUB, ORK | **V** | — | [100] |
| 43b | Brussels 140/276 vs 60/550 | **C → ~140 of 276** (Mon 22 Sep) | — | [101] |
| 43c | Reinfection | **V (snip)** | — | — |
| 43d | NCA arrest; charges? | **V / U** | Arrested ~23 Sep 2025 and bailed. No charges found. | [100][102] |
| 43e | HardBit vs Loki | **U (contested)** | — | [100][102] |
| 43f | RTX 8-K no material impact | **V (snip)** | — | — |
| 43g | Full restoration; ENISA/EASA/CAA response | **U / partial** | ENISA confirmed ransomware. No EASA or CAA action found. | [103] |
| 44a | NATS Aug 2023: 700k+, 34 recs | **V** | Report dated 14 Nov 2024. The "CAP2993" number was not confirmed. | [104] |
| 44b | NATS 30 Jul 2025, no malign activity | **V (snip)** | Root cause not published | — |
| 44c | NATS 8 Sep 2026: ~2,000 cancellations; 330k+ pax; millisecond; review dates; Ryanair | **C / V** | **">2,000 delayed, cancelled or diverted"**. 330k is **U**. Millisecond quote, review timeline and Ryanair call are V. | [105][106] |
| 44d | Prestwick 21 Sep 2026 ~60% cut | **U (weak)** | Blog sources only | — |
| 45a | NOTAM Jan 2023: deleted files; 11,000+ flights | **V (snip)** | ~1,300 cancelled plus ~10,000 delayed | [139] |
| 45b | NOTAM 2025 failures | **C** | Outages on **1 Feb and 22 Mar 2025**; causes not published | [107] |
| 46a | PHL TRACON 28 Apr & May 2025; "fried copper wire" | **V** | 9 May 90-second loss. Gottheimer's "fried" remark referred to 28 Apr. | — |
| 46b | 21 Sep 2026 fiber cut + failed backup; 5 airports; NJ Transit crew? | **V** | Verizon primary circuit failed while the backup fiber had already been cut by an **NJ Transit contractor** (Duffy first blamed Amtrak) | [108][109] |
| 46c | 1,000+ cancellations | **C** | 781 US-wide by 4 p.m. ET (not all outage-related) | [109] |
| 46d | $30B on top of $12.5B; Phase One ~$16B; GAO-26-107992 | **V / C** | $30B verified. GAO gives no Phase One total and notes no lifecycle cost estimate. | [110][111] |
| 47 | Minneapolis ARTCC 6 Aug 2026, ~2 h, telecom | **V** | "ATC Zero" label only in a blog. Root cause not published. | [112] |
| 48 | Sea-Tac: Rhysida, 100 BTC, not paid, ~90k | **V** | 100 BTC ≈ $6M (snip) | [113] |
| 49a | Alaska Jul 2025 / 23 Oct 2025 | **V / C** | 20 Jul: third-party hardware, ~3 h. 23 Oct: **400+** cancellations (229 was interim), "not a cybersecurity incident". | [114][115] |
| 49b | United 6 Aug 2025 Unimatic | **V (snip)** | — | — |
| 49c | American 24 Dec 2024 DXC | **V** | — | [116] |
| 49d | American 28 Jul 2026 ground stop | **V** | ~48 min. Cause undisclosed. | [116] |
| 50a | Copenhagen/Oslo; Frederiksen quote; no suspects | **V** | 23 Sep 2025 | [117] |
| 50b | Munich / Brussels dates | **V** | Munich early Oct 2025; Belgium 2–9 Nov 2025 | [118] |
| 50c | Vilnius balloons from Oct 2025 | **V (snip)** | — | — |
| 50d | Leipzig drone attributed to GRU 1 Sep 2026 | **C** | Germany blamed **Russia**. The GRU link is from unnamed US officials via ABC. | [119] |
| 50e | Luxembourg Findel 18 Sep 2026 | **U (weak)** | Blog only | — |
| 50f | Euronews quadrupling | **V** | — | [118] |
| 50g | UK military 340 Jan–Aug 2026 | **V** | 126 (2024) → 250 (2025) → ~340. Partly better monitoring. | [120] |
| 50h | Russia 2,860 closures (Forbes) | **V (partial)** | Forbes Russia via Charter'97. The forbes.ru original was behind a captcha. | — |
| 51a | Lithuania 300+ Mar 2025 | **V** | — | [123] |
| 51b | Two airliners over Sweden 17–18 Sep 2026 | **V (single source)** | — | — |
| 51c | Swedish 142 reports by 28 May 2026 | **V (single source)** | Reporting criteria changed | — |
| 51d | EASA SIB 2022-02R4 | **V** | R4 published 3 Jul 2026 | [121] |
| 51e | Foreign Policy 1 Jun 2026 | **V** | By Elisabeth Braw | [122] |
| 52 | "4–6 Apr 2026 European airport cyberattack" | **F** | No source, vendor or official named. No wire coverage. Disruption attributed to weather. | [124] |
| 53 | Tulsa / Qilin, 17–20 Jan 2026 | **V / U** | Qilin leak-site listing and airport statement (snip). Intrusion dates are U. | — |

### H. Gaps
| Gap | Status | Finding | Src |
|---|---|---|---|
| Reddit sentiment | **Filled (archive API)** | Practitioners say topology, not sabotage. Be Ready reaction is calm-to-cynical. Conspiracy posts get little engagement. | [129]–[136] |
| HN threads (PHP2Shell, AWS) | **Filled** | PHP2Shell 455 pts / 185 comments; AWS 2,246 pts / 2,057 comments | [125][127] |
| PHP2Shell or Be Ready linked to Cyber Polygon by notable source? | **No** | Only a small Substack (Be Ready) and an r/conspiracy post scoring 3 make the link | [22][134] |
| Why 72 hours? | **Partly filled** | EU: Niinistö report (Oct 2024), modelled on Finland (snip). UK: "while support reaches those in need" plus alignment with France, Ireland and the Netherlands. | [85][89][90] |
| NERC 2026–27 WRA / cyber | **Not yet published** | E-ISAC reportedly logged its fewest incident reports in 2025 (snip) | — |
| Aviation IT outage dataset | **None found** | GAO-19-514 (2019) is the last systematic count | — |
| Unpublished root causes | **Confirmed unpublished** | NATS Jul 2025, NOTAM Feb 2025, United Aug 2025, AA Jul 2026, Minneapolis Aug 2026. Alaska Oct 2025 only given as "primary data centre failure". | [107][112][114][116] |
