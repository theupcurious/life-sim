import type { SupportedCity } from './cityProfiles';

interface EraEntry {
  from: number;
  to: number;
  /** Short present-tense flavor (1–2 sentences). Woven into node descriptions. */
  text: string;
  /** Optional pop-culture hook for teenage/young-adult nodes */
  pop?: string;
}

const ERAS: Record<SupportedCity, EraEntry[]> = {
  Tokyo: [
    {
      from: 1955, to: 1964,
      text: `Tokyo is rebuilding at astonishing speed — the bullet train just launched for the 1964 Olympics and the country feels unstoppable.`,
      pop: `Godzilla is in cinemas and every kid knows it by heart.`,
    },
    {
      from: 1965, to: 1972,
      text: `Japan's economic miracle is in full swing. Color television floods living rooms and department stores burst with new appliances nobody had ten years ago.`,
      pop: `Manga magazines sell millions of copies a week — Astro Boy is an after-school institution.`,
    },
    {
      from: 1973, to: 1979,
      text: `The oil shock bites hard in 1973, but Japan pivots faster than anyone expects. The economy shakes, then steadies.`,
      pop: `Sony's Walkman lands in 1979, changing how the whole world listens to music — and it was made right here.`,
    },
    {
      from: 1980, to: 1989,
      text: `The bubble economy is breathtaking. Land in Tokyo is worth more per square meter than anywhere on earth. Nightclubs hand out 10,000-yen bills as change.`,
      pop: `Nintendo's Famicom is in every household; kids queue overnight for Dragon Quest sequels.`,
    },
    {
      from: 1990, to: 1997,
      text: `The bubble bursts almost overnight in 1990. Banks collapse, real estate crumbles, and Japan enters what economists later call the Lost Decade — a long, quiet stagnation nobody fully expected.`,
      pop: `Evangelion airs in 1995 and captures something about the national mood that nobody can quite explain.`,
    },
    {
      from: 1998, to: 2006,
      text: `Deflation has settled in like weather. Yet Tokyo's street culture explodes — Harajuku, Shibuya 109, cosplay — creativity filling in where economic confidence once was.`,
      pop: `Hana Yori Dango tops TV ratings; J-pop exports to the rest of Asia on a wave called Cool Japan.`,
    },
    {
      from: 2007, to: 2010,
      text: `The global financial crisis of 2008 hits Japan's export economy hard. Toyota recalls millions of cars; the national mood is cautious again.`,
      pop: `Perfume and AKB48 dominate charts; idol culture becomes a billion-dollar industry.`,
    },
    {
      from: 2011, to: 2019,
      text: `The 2011 earthquake and tsunami reshape everything — coastal towns, energy policy, national identity. Abenomics promises revival but wage growth remains elusive.`,
      pop: `Your Name breaks box office records worldwide; anime reaches a global audience that would have been unimaginable a generation ago.`,
    },
    {
      from: 2020, to: 2026,
      text: `The 2020 Olympics are delayed by COVID-19. Tokyo hosts them in 2021 — in empty stadiums. Birth rates hit record lows as the country quietly confronts a demographic cliff.`,
      pop: `City Pop of the 1980s goes viral on YouTube, rediscovered by a generation in São Paulo and Seoul.`,
    },
  ],

  Beijing: [
    {
      from: 1950, to: 1965,
      text: `The People's Republic is new and everything is being rebuilt. Collectivization, Soviet advisors, and the constant pressure of campaigns shape every family's choices.`,
      pop: `Revolutionary operas and posters of smiling workers wallpaper every public space.`,
    },
    {
      from: 1966, to: 1975,
      text: `The Cultural Revolution turns daily life upside down. Schools close, professionals are sent to farms, and old things — books, temples, family histories — are labeled dangerous.`,
      pop: `Only approved revolutionary songs play on loudspeakers. Western music is simply not something most people have ever heard.`,
    },
    {
      from: 1976, to: 1983,
      text: `The era of economic reform and opening up begins. State jobs still dominate, but private enterprise starts taking root. The phrase everyone keeps hearing is "to get rich is glorious."`,
      pop: `The first foreign tourists arrive. Young Beijingers crowd around foreigners on the street just to glimpse a Walkman or a pair of jeans.`,
    },
    {
      from: 1984, to: 1988,
      text: `Special Economic Zones boom in the south and the energy is electric. Refrigerators and televisions appear in apartments for the first time. Everyone believes the future is arriving.`,
      pop: `Cui Jian plays "Nothing to My Name" in 1986 and starts Chinese rock and roll. Bootleg cassettes pass hand to hand.`,
    },
    {
      from: 1989, to: 1994,
      text: `The pace of life accelerates dramatically as the 90s approach. New businesses open on every corner, and economic ambition becomes the defining feature of the city.`,
      pop: `VHS players bring Hong Kong action films north. Jackie Chan and Chow Yun-fat are the new icons.`,
    },
    {
      from: 1995, to: 2000,
      text: `The economy is roaring. Beijing's ring roads multiply. State-owned enterprise reforms leave millions unemployed at the same moment private business is exploding.`,
      pop: `The first internet cafés open. Connecting costs ¥10 an hour and the dial-up screech is everywhere.`,
    },
    {
      from: 2001, to: 2007,
      text: `WTO entry in 2001 and the 2008 Olympic bid supercharge the city. Entire hutong neighborhoods vanish overnight for ring roads and stadiums.`,
      pop: `Super Girl — China's answer to American Idol — draws 400 million viewers. Li Yuchun becomes a phenomenon.`,
    },
    {
      from: 2008, to: 2012,
      text: `The 2008 Olympics open with a ceremony that stops the world. China is arriving — visibly, unmistakably. Growth keeps coming in at double digits.`,
      pop: `Jay Chou and Faye Wong dominate playlists; Mandopop is the soundtrack of the new China.`,
    },
    {
      from: 2013, to: 2019,
      text: `The tech boom reaches maturity. WeChat becomes the operating system of daily life — payments, identity, social graph, all in one app. The city goes completely cashless almost overnight.`,
      pop: `The Palace Museum goes viral on social media — "Forbidden City aesthetic" sells out. Ancient and modern collapse into the same selfie.`,
    },
    {
      from: 2020, to: 2026,
      text: `COVID-19 starts here, and China seals off with a speed the rest of the world watches in disbelief. Zero-COVID years later bring a deep economic hangover; the property bubble wobbles.`,
      pop: `Douyin — TikTok's Chinese twin — is the lens through which a generation documents everything.`,
    },
  ],

  Shanghai: [
    {
      from: 1950, to: 1975,
      text: `Shanghai, once the most cosmopolitan city in Asia, is deliberately de-glamorized. The jazz clubs, racecourses, and foreign concessions are swept away. Old Shanghai families keep their stories quiet.`,
      pop: `Workers' propaganda movies replace Hollywood films. The city's famous nightlife exists only in memory.`,
    },
    {
      from: 1976, to: 1989,
      text: `Reform arrives slowly here — Shanghai is not yet a priority like the southern SEZs. But the city's old merchant instinct is restless. The Bund stands a bit emptier than it used to be, waiting.`,
      pop: `Zhang Mingmin's "My Chinese Heart" plays on every radio. Nostalgia is allowed now, at least for the nation.`,
    },
    {
      from: 1990, to: 1999,
      text: `Pudong is announced as a development zone in 1990 and Shanghai transforms faster than almost anywhere in human history. The Oriental Pearl Tower rises; the Stock Exchange reopens. Money flows in from everywhere.`,
      pop: `Cantopop from Hong Kong floods the city. Wang Fei — Faye Wong — is on every café stereo.`,
    },
    {
      from: 2000, to: 2009,
      text: `Shanghai is building for the 2010 World Expo and the construction cranes never stop. Property prices double, then double again. The city feels like it is being invented in real time.`,
      pop: `F4 and Taiwanese idol drama sweep the mainland; fashion magazines multiply. Being stylish in Shanghai means something again.`,
    },
    {
      from: 2010, to: 2019,
      text: `Post-Expo, Shanghai has arrived. Luxury brands line Huaihai Road. The art scene — galleries, design weeks, M50 — attracts global attention alongside the finance and the tech.`,
      pop: `Dianping — the Yelp of China — turns dinner into an optimized experience. Every restaurant queue is a live leaderboard.`,
    },
    {
      from: 2020, to: 2026,
      text: `The 2022 lockdown traps 25 million people at home for two months. The psychological and economic shock lingers. Yet the city rebuilds with the stubborn energy it has always had.`,
      pop: `Bubble tea chains from Shanghai — HeyTea, Nayuki — become the new Starbucks across Asia.`,
    },
  ],

  'New York': [
    {
      from: 1950, to: 1965,
      text: `New York is the center of the world — the UN just moved in, Madison Avenue is inventing consumer culture, and bebop is rewriting jazz downtown.`,
      pop: `West Side Story runs on Broadway; the Dodgers just left for LA and the wound is still fresh.`,
    },
    {
      from: 1966, to: 1974,
      text: `The city is in creative ferment and fiscal strain at the same time — Andy Warhol's Factory, Vietnam protests, Stonewall. Something is breaking open.`,
      pop: `The Velvet Underground play Max's Kansas City; half the crowd don't realize they're witnessing history.`,
    },
    {
      from: 1975, to: 1981,
      text: `New York nearly goes bankrupt in 1975. Graffiti covers the subway, whole Bronx blocks are abandoned, and arson for insurance is so common the borough smells of smoke. Yet out of that collapse, hip-hop is being born.`,
      pop: `Disco at Studio 54, hip-hop at Sedgwick Avenue — two different cities running parallel.`,
    },
    {
      from: 1982, to: 1989,
      text: `Wall Street explodes in the 1980s. Yuppies in suspenders flood the Upper East Side while the crack epidemic hollows out entire neighborhoods six blocks away.`,
      pop: `"Walk This Way" with Run-DMC and Aerosmith plays everywhere — rap just crossed over and nothing will be the same.`,
    },
    {
      from: 1990, to: 2000,
      text: `Crime drops dramatically under Giuliani; Times Square transforms from peep shows to Disney stores. Tech money from the dot-com boom starts reshaping downtown. Everyone feels it.`,
      pop: `Biggie vs. Tupac, then "Mo Money Mo Problems" at every cookout. Friends makes the coffee shop feel like home.`,
    },
    {
      from: 2001, to: 2007,
      text: `September 11 reshapes the city permanently — the skyline is different, the mood is different, the politics are different. Yet New York refuses to let grief be the only story.`,
      pop: `The Strokes release Is This It out of the Lower East Side; rock is briefly the center of the world again.`,
    },
    {
      from: 2008, to: 2014,
      text: `The 2008 financial crisis starts three blocks from City Hall. Banks fail, bonuses vanish, and the city braces. Then slowly, stubbornly, it comes back.`,
      pop: `Jay-Z's "Empire State of Mind" is the city's anthem for a generation. Every New Yorker feels personally named.`,
    },
    {
      from: 2015, to: 2019,
      text: `Tech money floods Brooklyn and Manhattan. Rents hit levels nobody thought possible; whole neighborhoods lose their character in a decade. But the energy still crackles.`,
      pop: `Hamilton plays at the Public Theater before Broadway; every ticket is impossible and the cast recording is on every pair of headphones.`,
    },
    {
      from: 2020, to: 2026,
      text: `COVID-19 empties the streets that never empty. New York loses more people than any American city in the spring of 2020. The recovery is hard-won and uneven.`,
      pop: `"New York, New York" plays from apartment windows at 7 p.m. every evening — for the healthcare workers, and for the city itself.`,
    },
  ],

  'San Francisco': [
    {
      from: 1950, to: 1966,
      text: `The Beats are drinking coffee in North Beach and writing the world differently. The city is small, foggy, and full of people who chose it deliberately.`,
      pop: `Kerouac's On the Road has just come out; hitchhiking and Coltrane on a record player feel like a complete life.`,
    },
    {
      from: 1967, to: 1973,
      text: `The Summer of Love fills the Haight-Ashbury with 100,000 young people. Jefferson Airplane plays from a flatbed truck. The energy is utopian and it does not last — but it leaves something.`,
      pop: `Janis Joplin at the Fillmore. Nobody in attendance knows she will be gone in three years.`,
    },
    {
      from: 1974, to: 1980,
      text: `Harvey Milk is elected to the Board of Supervisors — the first openly gay elected official in California. His assassination in 1978 shocks the city and ignites the LGBTQ+ rights movement.`,
      pop: `Disco and punk live three blocks apart here and somehow both feel appropriate.`,
    },
    {
      from: 1981, to: 1989,
      text: `AIDS arrives and the city is devastated in ways that don't make the national news for years. Entire friend groups disappear. The Castro organizes for survival before the government does.`,
      pop: `The Dead Kennedys and Metallica come from here. So does the first Macintosh, assembled in a garage forty minutes south.`,
    },
    {
      from: 1990, to: 1998,
      text: `A small internet is becoming a large one. Wired magazine launches in 1993 and the dot-com era begins — startups in SoMa, valuations that feel like fiction, a certain smell of money and possibility.`,
      pop: `Netscape goes public in 1995 and the stock price doubles on day one. Everyone starts thinking they should quit their job.`,
    },
    {
      from: 1999, to: 2003,
      text: `The bust. Companies with no revenue and hundreds of employees vanish in six months. The city empties out of a generation of twenty-somethings. The rent drops for the first time in a decade.`,
      pop: `Everyone who stayed has a story about the one company they almost joined. Google survived. Most did not.`,
    },
    {
      from: 2004, to: 2011,
      text: `Google's IPO in 2004 signals the rebuilding. Facebook moves from Cambridge to Palo Alto. The tech buses start running, ferrying workers down the peninsula on company shuttles.`,
      pop: `Twitter is invented in a park brainstorm session in 2006. The founders disagree, quietly, about what it is.`,
    },
    {
      from: 2012, to: 2019,
      text: `The second tech boom is louder than the first. Housing costs triple; the Mission loses its murals to luxury condos. Protesters block the Google buses. The city is in a genuine argument with itself about what it wants to be.`,
      pop: `Kendrick Lamar is from Compton but feels like the Bay. "Alright" becomes an anthem at protests from Oakland to Ferguson.`,
    },
    {
      from: 2020, to: 2026,
      text: `COVID empties the offices that were always full. Half of tech goes remote permanently; rents fall, then rise in different cities. San Francisco argues about whether it needs to reinvent itself again.`,
      pop: `A Bay Area meme — "tech people in Slack" — captures the era better than any memoir.`,
    },
  ],

  Toronto: [
    {
      from: 1950, to: 1966,
      text: `Toronto is famously described as "a city that works." The phrase is meant as a compliment, but also says something about its ambitions. The suburbs are growing fast; everyone is buying a car.`,
      pop: `Hockey Night in Canada on CBC Saturday is the closest thing the country has to a shared religion.`,
    },
    {
      from: 1967, to: 1975,
      text: `Canada turns 100 in 1967 — Expo 67 in Montreal is the national coming-out party. Toronto watches the CN Tower go up year by year. Pierre Trudeau the elder is making federalism feel electric.`,
      pop: `Joni Mitchell, Neil Young, Gordon Lightfoot — Canadians are quietly dominating the American folk scene.`,
    },
    {
      from: 1976, to: 1984,
      text: `The CN Tower opens in 1976 as the world's tallest structure — and it stays that way for a generation. The city is building confidence along with infrastructure.`,
      pop: `Saturday Night Fever and Star Wars compete for cinemas. SCTV is produced in Edmonton but it's a national joke machine.`,
    },
    {
      from: 1985, to: 1993,
      text: `Free trade with the US passes after a fierce national debate in 1988. The early 1990s recession hits Ontario hard — car plants close, government deficits soar. It is a genuinely difficult few years.`,
      pop: `Degrassi Junior High plays every weekday after school. Its particular brand of relentless realism feels like life.`,
    },
    {
      from: 1994, to: 2002,
      text: `NAFTA passes; the economy gradually rights itself. Toronto becomes definitively the largest city in Canada — overtaking Montreal in culture, finance, and immigration.`,
      pop: `Barenaked Ladies sell out arenas. Alanis Morissette's Jagged Little Pill is Canadian rage going global.`,
    },
    {
      from: 2003, to: 2010,
      text: `SARS in 2003 costs Toronto more than a billion dollars in tourism and trade. It is a warning about epidemic risk that most of the world forgets within a year.`,
      pop: `Drake releases his first mixtape So Far Gone in 2009 from his Toronto bedroom. The city has never been on the map quite like this.`,
    },
    {
      from: 2011, to: 2019,
      text: `Real estate prices rise every year without fail, turning homeownership into a life-organizing obsession. Tech sector jobs multiply; the waterfront transforms. Toronto is now a global city, still trying to figure out what that means.`,
      pop: `Drake's "God's Plan" is the year's most-streamed song. "Toronto" is now a brand, not just a city.`,
    },
    {
      from: 2020, to: 2026,
      text: `COVID hits the long-term care homes hardest — a national scandal. The city pivots, endures, and eventually returns to the steady pace of a place that knows how to absorb disruption.`,
      pop: `The Weeknd performs at the Super Bowl halftime show; the city claims him completely.`,
    },
  ],

  Singapore: [
    {
      from: 1950, to: 1964,
      text: `Singapore is still a British colony for the early part of this era, then briefly part of Malaysia. Independence arrives in 1965 — and not entirely by choice.`,
      pop: `P. Ramlee's Malay films play in the cinemas. The city is polyglot, chaotic, and very young.`,
    },
    {
      from: 1965, to: 1975,
      text: `Lee Kuan Yew's government begins the great transformation — HDB flats go up everywhere, British troops leave, and the city-state that was told it could not survive starts surviving.`,
      pop: `National Day songs are catchy by government directive. The communal singalong is deliberate, and it works.`,
    },
    {
      from: 1976, to: 1984,
      text: `Industrialization is running ahead of schedule. Japanese manufacturers open plants; the port becomes one of the busiest in the world. Per capita income is rising faster than almost anywhere.`,
      pop: `Rediffusion cable radio brings Cantonese serials into every kampong house. TV is still in black and white for a while.`,
    },
    {
      from: 1985, to: 1993,
      text: `A brief recession in 1985 is a shock — the first in twenty years. Singapore responds with structural reforms and recovers quickly. The city is pragmatic above all.`,
      pop: `The National Arts Council is set up. Singapore is trying to become a cultural hub, not just a logistics one.`,
    },
    {
      from: 1994, to: 2002,
      text: `The Asian financial crisis of 1997 hits neighbors hard but Singapore weathers it better than most. Changi Airport repeatedly wins best-in-world. The country is quietly proud of its efficiency.`,
      pop: `"Singapore Girl" is the world's most recognizable airline mascot. The city exports its brand of order even at 35,000 feet.`,
    },
    {
      from: 2003, to: 2009,
      text: `SARS hits in 2003 — Singapore's contact tracing and quarantine system becomes a global case study. The government greenlit the Integrated Resorts (casinos) debate after years of refusing. Pragmatism wins again.`,
      pop: `Jack Neo's Singaporean comedies sell out cinemas. Singlish lah is a national identity marker, not just slang.`,
    },
    {
      from: 2010, to: 2019,
      text: `Marina Bay Sands opens in 2010 and instantly becomes the skyline. The city pivots to fintech, biomedical, and smart city tech. Income inequality rises uncomfortably alongside GDP.`,
      pop: `Crazy Rich Asians (2018) puts Singapore's glass towers and hawker centers before a global audience for the first time.`,
    },
    {
      from: 2020, to: 2026,
      text: `Singapore's pandemic response is disciplined and fast — masks, QR codes, TraceTogether — then vaccines at record speed. The city-state resumes its quiet, ordered efficiency as if nothing too dramatic happened.`,
      pop: `BTS play Singapore on their world tour; 50,000 people queue for tickets that disappear in four minutes.`,
    },
  ],
};

/**
 * Returns a contextual historical flavor snippet for a given city and calendar year.
 * Returns null if no matching era is found.
 */
export function getHistoricalFlavor(city: string, year: number): string | null {
  const eras = ERAS[city as SupportedCity];
  if (!eras) return null;
  const match = eras.find(e => year >= e.from && year <= e.to);
  return match ? match.text : null;
}

/**
 * Returns the pop culture hook for a given city and year, for teenage/young-adult nodes.
 */
export function getPopCultureHook(city: string, year: number): string | null {
  const eras = ERAS[city as SupportedCity];
  if (!eras) return null;
  const match = eras.find(e => year >= e.from && year <= e.to);
  return match?.pop ?? null;
}
