// Notes for grammatical morphemes, written for this project. Forms are keyed
// by `canonical form/tag` (see canonical() in src/lib/hangul.ts), so 었/았/였
// share one entry. Patterns span several units (고 + 있다) and are matched
// after single forms; they win where both apply.

export interface Grammar {
  id: string
  /** How the form is cited, e.g. -고 있다. */
  title: string
  /** Short meaning shown under the unit. */
  label: string
  category: string
  note: string
}

export interface GrammarForm extends Grammar {
  keys: string[]
}

export interface GrammarPattern extends Grammar {
  /** Unit by unit: `forms/tags`, alternatives split by |, e.g. 'ㄴ|는/ETM'. */
  seq: string[]
  /** Only when the first two units are contracted into one syllable (잖 = 지 + 않). */
  contracted?: boolean
}

export const FORMS: GrammarForm[] = [
  // Case particles
  { id: 'topic', keys: ['은/JX', '는/JX', 'ㄴ/JX'], title: '은/는', label: 'Topic', category: 'Particle', note: 'Marks the topic: what the sentence is about ("as for…"). It often sets the topic against something else. 은 follows a consonant, 는 a vowel; ㄴ is a spoken contraction (난 = 나는).' },
  { id: 'subject', keys: ['이/JKS', '가/JKS'], title: '이/가', label: 'Subject', category: 'Particle', note: 'Marks the subject: who or what does the action or has the quality. Compared with 은/는 it points at new or specific information ("it is X that…"). 이 after a consonant, 가 after a vowel.' },
  { id: 'subject-hon', keys: ['께서/JKS'], title: '께서', label: 'Subject (honorific)', category: 'Particle', note: 'The honorific form of 이/가, used when the subject is someone you respect (parents, teachers, customers).' },
  { id: 'object', keys: ['을/JKO', '를/JKO', 'ㄹ/JKO'], title: '을/를', label: 'Object', category: 'Particle', note: 'Marks the direct object: what the action is done to. 을 after a consonant, 를 after a vowel; ㄹ is a spoken contraction (날 = 나를).' },
  { id: 'possessive', keys: ['의/JKG'], title: '의', label: "'s / of", category: 'Particle', note: 'Links two nouns: A의 B is "A\'s B" or "B of A". In speech it is often dropped (엄마 가방) or pronounced 에.' },
  { id: 'complement', keys: ['이/JKC', '가/JKC'], title: '이/가 (complement)', label: 'Complement', category: 'Particle', note: 'With 되다 ("become") and 아니다 ("not be"), the noun before them takes 이/가: 의사가 되다 "become a doctor", 학생이 아니다 "is not a student".' },
  { id: 'at', keys: ['에/JKB'], title: '에', label: 'at / to / in', category: 'Particle', note: 'Marks a place where something is, a destination (학교에 가다), or a time (3시에). Also "per": 하루에 두 번 "twice a day".' },
  { id: 'at-action', keys: ['에서/JKB', '서/JKB'], title: '에서', label: 'at / from', category: 'Particle', note: 'Marks the place where an action happens (도서관에서 공부하다) or a starting point (서울에서 왔다). Compare 에, which marks where something simply is or goes.' },
  { id: 'by-means', keys: ['로/JKB'], title: '(으)로', label: 'by / toward / as', category: 'Particle', note: 'Means or tool (버스로 가다), direction (집으로 가다), change into (얼음이 물로 변하다), or capacity. 으로 after a consonant other than ㄹ.' },
  { id: 'to-person', keys: ['에게/JKB', '한테/JKB'], title: '에게/한테', label: 'to (someone)', category: 'Particle', note: 'Marks the person who receives something or is affected: 친구에게 선물을 주다. 한테 is more casual.' },
  { id: 'to-person-hon', keys: ['께/JKB'], title: '께', label: 'to (honorific)', category: 'Particle', note: 'Honorific form of 에게, for someone you respect: 할머니께 드리다.' },
  { id: 'from-person', keys: ['에게서/JKB', '한테서/JKB'], title: '에게서/한테서', label: 'from (someone)', category: 'Particle', note: 'Marks the person something comes from: 친구에게서 편지를 받았다.' },
  { id: 'from', keys: ['로부터/JKB'], title: '(으)로부터', label: 'from', category: 'Particle', note: 'A formal "from", used for sources, origins and senders, mostly in writing.' },
  { id: 'as-role', keys: ['로서/JKB'], title: '(으)로서', label: 'as (a role)', category: 'Particle', note: 'In the capacity of: 부모로서 "as a parent".' },
  { id: 'with', keys: ['과/JKB', '와/JKB', '하고/JKB', '랑/JKB', '이랑/JKB'], title: '과/와', label: 'with', category: 'Particle', note: 'Together with someone or something: 친구와 놀다. 과 after a consonant, 와 after a vowel; 하고 and (이)랑 are spoken.' },
  { id: 'and', keys: ['과/JC', '와/JC', '하고/JC', '랑/JC', '이랑/JC'], title: '과/와', label: 'and', category: 'Particle', note: 'Joins nouns: 빵과 우유 "bread and milk". 과 after a consonant, 와 after a vowel.' },
  { id: 'or-noun', keys: ['이나/JC', '나/JC'], title: '(이)나', label: 'or', category: 'Particle', note: 'Joins nouns as alternatives: 커피나 차 "coffee or tea".' },
  { id: 'than', keys: ['보다/JKB'], title: '보다', label: 'than', category: 'Particle', note: 'Marks what is compared against: 형이 나보다 크다 "my brother is taller than me".' },
  { id: 'like', keys: ['처럼/JKB', '같이/JKB'], title: '처럼', label: 'like', category: 'Particle', note: 'Likeness: 꽃처럼 예쁘다 "pretty like a flower".' },
  { id: 'quote-particle', keys: ['라고/JKQ', '이라고/JKQ', '고/JKQ'], title: '(이)라고', label: 'quoting', category: 'Particle', note: 'Marks quoted words, usually before 말하다, 하다 or 부르다: "…"라고 말했다.' },
  { id: 'vocative', keys: ['아/JKV', '야/JKV'], title: '아/야', label: 'calling (hey)', category: 'Particle', note: 'Added to a name when calling someone casually: 민수야!' },

  // Auxiliary particles
  { id: 'also', keys: ['도/JX'], title: '도', label: 'also / even', category: 'Particle', note: '"Too, also"; with numbers or negatives, "even": 한 명도 없다 "not even one person". It replaces 이/가 and 을/를.' },
  { id: 'only', keys: ['만/JX'], title: '만', label: 'only', category: 'Particle', note: '"Only, just": 물만 마셨다 "drank only water".' },
  { id: 'from-start', keys: ['부터/JX'], title: '부터', label: 'from (start)', category: 'Particle', note: 'Starting point in time or order: 아침부터 "since the morning". Often paired with 까지.' },
  { id: 'until', keys: ['까지/JX'], title: '까지', label: 'until / up to / even', category: 'Particle', note: 'End point in time or space (5시까지, 역까지), or "even, on top of that".' },
  { id: 'every', keys: ['마다/JX'], title: '마다', label: 'every', category: 'Particle', note: '"Every, each": 날마다 "every day", 사람마다 "each person".' },
  { id: 'or-choice', keys: ['이나/JX', '나/JX'], title: '(이)나', label: 'or so / as many as', category: 'Particle', note: 'Makes a choice sound casual ("…or something": 커피나 마시자), or after a number stresses that it is a lot: 세 시간이나 "a whole three hours".' },
  { id: 'only-neg', keys: ['밖에/JX'], title: '밖에', label: 'only (+ negative)', category: 'Particle', note: '"Nothing but", always followed by a negative verb: 천 원밖에 없다 "I only have 1,000 won".' },
  { id: 'only-ppun', keys: ['뿐/JX'], title: '뿐', label: 'only', category: 'Particle', note: '"Only, alone": 너뿐이다 "it\'s only you".' },
  { id: 'even-if', keys: ['라도/JX', '이라도/JX', '라도/EC'], title: '(이)라도', label: 'even / at least', category: 'Particle', note: 'Second-best choice: 물이라도 주세요 "give me at least some water".' },
  { id: 'emphasis-ya', keys: ['야/JX', '이야/JX'], title: '(이)야', label: 'only then / as for', category: 'Particle', note: 'Emphasises the item: 지금이야 알겠다 "now (finally) I understand".' },
  { id: 'polite-yo', keys: ['요/JX'], title: '요', label: 'polite', category: 'Particle', note: 'Added to words or phrases to make them polite: 저요? "me?".' },

  // Pre-final endings
  { id: 'past', keys: ['었/EP'], title: '-았/었-', label: 'Past Tense', category: 'Tense', note: 'Past tense. 았 after a stem whose last vowel is ㅏ or ㅗ, 었 after others, 였 after 하 (했 in speech). Doubled 았었/었었 means "had (and no longer)".' },
  { id: 'future', keys: ['겠/EP'], title: '-겠-', label: 'Will / Must be', category: 'Tense', note: 'Intention ("I will"), a guess ("it must be"), or politeness in set phrases (잘 먹겠습니다).' },
  { id: 'honorific', keys: ['시/EP'], title: '-(으)시-', label: 'Honorific', category: 'Honorific', note: 'Shows respect for the subject of the verb: 선생님이 오셨다 "the teacher came". 으시 after a consonant.' },

  // Sentence endings
  { id: 'plain', keys: ['다/EF'], title: '-다', label: 'Plain Statement', category: 'Sentence ending', note: 'The plain (해라체) statement ending, used in writing: books, news, diaries, and dictionary examples like these. Not rude in print, but too blunt to say to a stranger.' },
  { id: 'plain-present', keys: ['ㄴ다/EF'], title: '-ㄴ/는다', label: 'Plain Statement (present)', category: 'Sentence ending', note: 'Plain present-tense statement for action verbs: 간다, 먹는다. Adjectives use -다 instead (예쁘다).' },
  { id: 'polite', keys: ['어요/EF', '에요/EF', '예요/EF', '이에요/EF'], title: '-아/어요', label: 'Polite Informal', category: 'Sentence ending', note: 'The everyday polite ending (해요체). It works for statements, questions, suggestions and requests depending on intonation. After a noun: 이에요/예요.' },
  { id: 'casual', keys: ['어/EF', '야/EF'], title: '-아/어', label: 'Casual', category: 'Sentence ending', note: 'Casual speech (반말) for friends, younger people and family; the polite ending without 요. After a noun: (이)야.' },
  { id: 'formal', keys: ['ㅂ니다/EF'], title: '-ㅂ/습니다', label: 'Formal Statement', category: 'Sentence ending', note: 'Formal polite statement (하십시오체): news, speeches, business, the army. 습니다 after a consonant.' },
  { id: 'formal-q', keys: ['ㅂ니까/EF'], title: '-ㅂ/습니까', label: 'Formal Question', category: 'Sentence ending', note: 'Formal polite question.' },
  { id: 'request', keys: ['세요/EF'], title: '-(으)세요', label: 'Please / Honorific', category: 'Sentence ending', note: 'Honorific polite ending (시 + 어요). As a command it is a polite "please do"; as a statement or question it shows respect for the subject.' },
  { id: 'formal-command', keys: ['십시오/EF', 'ㅂ시오/EF'], title: '-(으)십시오', label: 'Please (formal)', category: 'Sentence ending', note: 'Formal polite command: 앉으십시오 "please be seated".' },
  { id: 'lets-formal', keys: ['ㅂ시다/EF'], title: '-ㅂ/읍시다', label: "Let's", category: 'Sentence ending', note: '"Let\'s…" among equals or to people below you. Avoid it with superiors.' },
  { id: 'lets', keys: ['자/EF'], title: '-자', label: "Let's (plain)", category: 'Sentence ending', note: 'Plain "let\'s…", to friends.' },
  { id: 'command', keys: ['어라/EF', '라/EF'], title: '-아/어라', label: 'Command (plain)', category: 'Sentence ending', note: 'Plain command, to children or close friends, or in writing (instructions in textbooks).' },
  { id: 'question-plain', keys: ['니/EF', '냐/EF', 'ㄴ가/EF', '나/EF'], title: '-니/-냐/-나', label: 'Question (plain)', category: 'Sentence ending', note: 'Plain-speech questions. -ㄴ가/는가 is a written or musing question ("I wonder…").' },
  { id: 'soft-question', keys: ['나요/EF', 'ㄴ가요/EF'], title: '-나요', label: 'Soft Question', category: 'Sentence ending', note: 'A gentle polite question.' },
  { id: 'confirm', keys: ['지/EF', '지요/EF', '죠/EF'], title: '-지(요)', label: "…right? / of course", category: 'Sentence ending', note: 'Assumes the listener agrees: 맛있지요? "it\'s tasty, right?". 죠 is the contraction.' },
  { id: 'you-know-ef', keys: ['잖아/EF', '잖아요/EF'], title: '-잖아(요)', label: 'You Know', category: 'Sentence ending', note: 'Reminds the listener of something they already know, or should: 내가 말했잖아 "I told you, didn\'t I". Contracted from -지 않아(요), but it no longer means "not".' },
  { id: 'exclaim', keys: ['네/EF', '네요/EF', '구나/EF', 'ㄴ구나/EF', '군요/EF', 'ㄴ군요/EF'], title: '-네(요)/-구나', label: 'Oh! (realizing)', category: 'Sentence ending', note: 'Exclamation at something just noticed or learned: 비가 오네요 "oh, it\'s raining".' },
  { id: 'shall', keys: ['ㄹ까/EF', 'ㄹ까요/EF'], title: '-(으)ㄹ까(요)', label: 'Shall we? / I wonder', category: 'Sentence ending', note: 'Offers or suggestions ("shall I…?"), or wondering aloud ("will it…?").' },
  { id: 'promise', keys: ['ㄹ게/EF', 'ㄹ게요/EF'], title: '-(으)ㄹ게(요)', label: 'I will (promise)', category: 'Sentence ending', note: 'Speaker\'s promise or decision that affects the listener: 내가 할게 "I\'ll do it".' },

  // Connectors
  { id: 'eo', keys: ['어/EC'], title: '-아/어', label: 'and (then)', category: 'Connector', note: 'Links a verb to the next one: mostly before an auxiliary verb (먹어 보다, 써 주다), or meaning "and then / by doing".' },
  { id: 'eoseo', keys: ['어서/EC'], title: '-아/어서', label: 'so / and then', category: 'Connector', note: 'Reason ("because", 배가 아파서 못 갔다) or a sequence where the first step leads to the second (가서 보다 "go and see"). Not used with commands or suggestions for reasons.' },
  { id: 'go', keys: ['고/EC'], title: '-고', label: 'and', category: 'Connector', note: 'Joins clauses: "and", or "and then" for actions in order. Also the base of many patterns (-고 있다, -고 싶다).' },
  { id: 'ge', keys: ['게/EC'], title: '-게', label: 'so that / -ly', category: 'Connector', note: 'Turns an adjective into an adverb (예쁘게 "prettily") or expresses purpose/result. Also in -게 되다 and -게 하다.' },
  { id: 'ji', keys: ['지/EC'], title: '-지', label: '(negation base)', category: 'Connector', note: 'Used before 않다, 못하다 and 말다 to negate the verb: 가지 않다 "not go".' },
  { id: 'if', keys: ['면/EC'], title: '-(으)면', label: 'if / when', category: 'Connector', note: 'Condition: 비가 오면 "if/when it rains".' },
  { id: 'if-were', keys: ['ㄴ다면/EC', '다면/EC', '라면/EC'], title: '-(ㄴ/는)다면', label: 'if (it were)', category: 'Connector', note: 'Hypothetical "if": 내가 새라면 "if I were a bird".' },
  { id: 'must', keys: ['어야/EC'], title: '-아/어야', label: 'only if / must', category: 'Connector', note: '"Only if" (먹어야 산다 "you live only if you eat"). With 하다/되다 it means "must" (-아/어야 하다).' },
  { id: 'as-soon', keys: ['자/EC', '자마자/EC'], title: '-자(마자)', label: 'as soon as', category: 'Connector', note: '"As soon as / when": 집에 도착하자마자 잤다. The plain -자 also links a cause with what followed in writing.' },
  { id: 'and-while', keys: ['며/EC'], title: '-(으)며', label: 'and / while', category: 'Connector', note: 'Written "and" (like -고), or two actions at once (like -면서).' },
  { id: 'while', keys: ['면서/EC'], title: '-(으)면서', label: 'while', category: 'Connector', note: 'Two things at the same time by the same subject: 음악을 들으면서 공부하다.' },
  { id: 'since', keys: ['니/EC', '니까/EC'], title: '-(으)니(까)', label: 'since / when I…', category: 'Connector', note: 'Reason, often subjective, and fine before commands (추우니까 입어). Also "when I did X, I found that…": 문을 여니 비가 왔다.' },
  { id: 'say-that', keys: ['다고/EC', 'ㄴ다고/EC'], title: '-(ㄴ/는)다고', label: 'that (quoting)', category: 'Connector', note: 'Reported statement: 비가 온다고 했다 "said that it rains". Before 해서 it means "just because": -다고 해서.' },
  { id: 'say-that-ra', keys: ['라고/EC'], title: '-(이)라고 / -(으)라고', label: 'that it is / to (do)', category: 'Connector', note: 'Reported speech of a noun statement (학생이라고 했다 "said they were a student") or of a command (가라고 했다 "told me to go").' },
  { id: 'say-lets', keys: ['자고/EC'], title: '-자고', label: "suggested that", category: 'Connector', note: 'Reported suggestion: 같이 가자고 했다 "suggested going together".' },
  { id: 'say-q', keys: ['냐고/EC', '느냐고/EC'], title: '-(느)냐고', label: 'asked whether', category: 'Connector', note: 'Reported question: 어디 가냐고 물었다.' },
  { id: 'saying', keys: ['다며/EC', '라며/EC', '다면서/EC', '라면서/EC'], title: '-다며', label: 'saying that', category: 'Connector', note: 'Reported speech plus another action: "saying that…, (they) did…". In questions: "I heard that… is it true?"' },
  { id: 'but', keys: ['지만/EC'], title: '-지만', label: 'but', category: 'Connector', note: 'Contrast: 비싸지만 좋다 "expensive but good".' },
  { id: 'but-formal', keys: ['나/EC'], title: '-(으)나', label: 'but (formal)', category: 'Connector', note: 'Written "but", like -지만.' },
  { id: 'whether', keys: ['ㄴ지/EC', 'ㄹ지/EC'], title: '-(으)ㄴ/는지', label: 'whether / wh-', category: 'Connector', note: 'Embedded question: 어디 사는지 몰라요 "I don\'t know where they live". Also "since": 온 지 3년 "three years since I came".' },
  { id: 'background', keys: ['ㄴ데/EC'], title: '-(으)ㄴ/는데', label: 'and / but (background)', category: 'Connector', note: 'Sets the background for what follows: "…, and / but / so". Very common and flexible.' },
  { id: 'then-observed', keys: ['더니/EC'], title: '-더니', label: 'and then (I saw)', category: 'Connector', note: 'Something the speaker observed, followed by a change or result: 아침에 흐리더니 비가 왔다.' },
  { id: 'intend', keys: ['려고/EC'], title: '-(으)려고', label: 'in order to', category: 'Connector', note: 'Intention or purpose: 사려고 왔다 "came to buy". -려고 하다 "plan to".' },
  { id: 'if-intend', keys: ['려면/EC'], title: '-(으)려면', label: 'if you want to', category: 'Connector', note: '"If you intend to…": 가려면 버스를 타세요.' },
  { id: 'even-if', keys: ['어도/EC'], title: '-아/어도', label: 'even if', category: 'Connector', note: '"Even if / even though": 비가 와도 간다. With 되다: "it\'s OK to" (-아/어도 되다).' },
  { id: 'copula-ra', keys: ['라/EC', '라서/EC'], title: '-(이)라(서)', label: 'as it is / because', category: 'Connector', note: 'The connective form of 이다 / 아니다: 학생이라서 "because (I) am a student".' },
  { id: 'to-go-do', keys: ['러/EC'], title: '-(으)러', label: 'to (do)', category: 'Connector', note: 'Purpose with verbs of movement only: 밥 먹으러 가다 "go to eat".' },
  { id: 'so-that', keys: ['도록/EC'], title: '-도록', label: 'so that / until', category: 'Connector', note: 'Purpose or degree: 늦지 않도록 "so as not to be late", 밤새도록 "until dawn".' },
  { id: 'while-then', keys: ['다가/EC', '다/EC'], title: '-다가', label: 'while … then', category: 'Connector', note: 'An action is interrupted or switched: 걷다가 넘어졌다 "fell while walking". -다 is the short form.' },
  { id: 'because-busy', keys: ['느라/EC', '느라고/EC'], title: '-느라(고)', label: 'because (busy) doing', category: 'Connector', note: 'Reason, usually for a negative result: 공부하느라 못 잤다 "couldn\'t sleep because I was studying".' },
  { id: 'habit', keys: ['곤/EC', '고는/EC'], title: '-곤 하다', label: 'used to (habit)', category: 'Connector', note: 'Repeated habit, usually with 하다: 주말마다 산에 가곤 했다.' },
  { id: 'the-more', keys: ['ㄹ수록/EC'], title: '-(으)ㄹ수록', label: 'the more…', category: 'Connector', note: '"The more…, the more…": 볼수록 좋다.' },
  { id: 'whether-ga', keys: ['ㄴ가/EC'], title: '-(으)ㄴ가', label: 'whether (I wonder)', category: 'Connector', note: 'Embedded question about an uncertain fact: 아픈가 싶다 "I think maybe I\'m sick".' },
  { id: 'surprise', keys: ['다니/EC'], title: '-다니', label: "I can't believe…", category: 'Connector', note: 'Surprise or disbelief at what was heard: 벌써 끝났다니!' },
  { id: 'or', keys: ['거나/EC'], title: '-거나', label: 'or', category: 'Connector', note: 'Alternatives between actions: 책을 읽거나 영화를 본다.' },
  { id: 'because-formal', keys: ['므로/EC'], title: '-(으)므로', label: 'because (formal)', category: 'Connector', note: 'Written "because", in formal reports and notices.' },
  { id: 'wonder-whether', keys: ['ㄹ까/EC'], title: '-(으)ㄹ까', label: 'whether (worried)', category: 'Connector', note: 'Wondering or worrying: 늦을까 걱정이다 "worried I\'ll be late".' },
  { id: 'and-bring', keys: ['어다/EC', '어다가/EC'], title: '-아/어다(가)', label: 'and (take it)', category: 'Connector', note: 'Do something and move the result elsewhere: 물을 떠다 주다 "fetch water and give it".' },

  // Modifiers and nominalizers
  { id: 'mod-past', keys: ['ㄴ/ETM'], title: '-(으)ㄴ', label: 'Modifier (past / state)', category: 'Modifier', note: 'Turns the clause into a description of the next noun. With verbs it is past ("the book I read" 읽은 책); with adjectives it is present ("a pretty flower" 예쁜 꽃).' },
  { id: 'mod-present', keys: ['는/ETM'], title: '-는', label: 'Modifier (present)', category: 'Modifier', note: 'Present-tense description of the next noun, for action verbs and 있다/없다: 먹는 사람 "the person who eats/is eating".' },
  { id: 'mod-future', keys: ['ㄹ/ETM'], title: '-(으)ㄹ', label: 'Modifier (future)', category: 'Modifier', note: 'Describes the next noun as future or potential: 내일 볼 영화 "the movie (we) will see". Also in -ㄹ 수 있다, -ㄹ 때, -ㄹ 것이다.' },
  { id: 'mod-retro', keys: ['던/ETM'], title: '-던', label: 'Modifier (used to)', category: 'Modifier', note: 'Something that used to happen or was in progress and stopped: 내가 다니던 학교 "the school I used to go to".' },
  { id: 'mod-quote', keys: ['다는/ETM', 'ㄴ다는/ETM', '라는/ETM'], title: '-다는/-라는', label: 'that says / called', category: 'Modifier', note: 'Shortened from -다고 하는: gives the content of the next noun: 온다는 소식 "the news that they\'re coming", 민수라는 사람 "a person called Minsu".' },
  { id: 'mod-intend', keys: ['려는/ETM'], title: '-(으)려는', label: 'intending to', category: 'Modifier', note: 'Modifier form of -려고 하다: 가려는 사람 "a person who is about to go".' },
  { id: 'nominal-gi', keys: ['기/ETN'], title: '-기', label: 'Nominalizer (-ing)', category: 'Nominalizer', note: 'Turns a verb into a noun ("to do / doing"): 읽기 "reading". Base of many patterns: -기 때문에, -기 위해, -기 시작하다.' },
  { id: 'nominal-m', keys: ['ㅁ/ETN'], title: '-(으)ㅁ', label: 'Nominalizer (fact)', category: 'Nominalizer', note: 'Turns a clause into a noun stating a fact, mostly in writing or notes: 그가 왔음을 알았다.' },

  // Copula and derivational suffixes
  { id: 'copula', keys: ['이/VCP'], title: '이다', label: 'to be', category: 'Copula', note: '"To be (something)": attaches straight to a noun: 학생이다 "is a student". After a vowel the 이 is often dropped (의사다).' },
  { id: 'not-be', keys: ['아니/VCN'], title: '아니다', label: 'to not be', category: 'Copula', note: 'Negative of 이다: 학생이 아니다 "is not a student". The noun before it takes 이/가.' },
  { id: 'plural', keys: ['들/XSN'], title: '-들', label: 'Plural', category: 'Suffix', note: 'Plural marker for nouns, mostly people and countable things. Often left out when the plural is obvious.' },
  { id: 'hon-nim', keys: ['님/XSN'], title: '-님', label: 'Honorific (Mr./Ms.)', category: 'Suffix', note: 'Respectful suffix for titles and names: 선생님, 사장님, 고객님.' },
  { id: 'adj-jeok', keys: ['적/XSN'], title: '-적', label: '-ic / -al', category: 'Suffix', note: 'Sino-Korean suffix making "-ic/-al" words: 문화적 "cultural", 경제적 "economic". Often followed by 인 or 으로.' },
  { id: 'name-i', keys: ['이/XSN'], title: '-이', label: '(name ending)', category: 'Suffix', note: 'Added to Korean given names ending in a consonant in casual speech: 민준 → 민준이.' },
  { id: 'each', keys: ['씩/XSN'], title: '-씩', label: 'each / per', category: 'Suffix', note: 'Distribution: 하나씩 "one each", 조금씩 "little by little".' },
  { id: 'about', keys: ['쯤/XSN'], title: '-쯤', label: 'about', category: 'Suffix', note: 'Approximation: 3시쯤 "around 3 o\'clock".' },
  { id: 'ordinal', keys: ['째/XSN'], title: '-째', label: '-th (order)', category: 'Suffix', note: 'Order: 첫째 "first", 두 번째 "second time".' },
  { id: 'ization', keys: ['화/XSN'], title: '-화', label: '-ization', category: 'Suffix', note: 'Sino-Korean "-ization": 현대화 "modernization".' },
  { id: 'ness', keys: ['성/XSN'], title: '-성', label: '-ness / -ity', category: 'Suffix', note: 'Quality or property: 가능성 "possibility".' },
  { id: 'doer', keys: ['꾼/XSN', '가/XSN', '자/XSN'], title: '-꾼/-가/-자', label: 'person who…', category: 'Suffix', note: 'A person known for an activity: 사냥꾼 "hunter", 작가 "writer".' },
  { id: 'worth', keys: ['짜리/XSN'], title: '-짜리', label: 'worth / sized', category: 'Suffix', note: '"Worth / containing": 만 원짜리 "a 10,000-won one".' },
  { id: 'do-suffix', keys: ['하/XSV'], title: '-하다', label: 'do (makes a verb)', category: 'Suffix', note: 'Turns a noun into a verb: 공부 "study (n.)" → 공부하다 "to study".' },
  { id: 'adj-suffix', keys: ['하/XSA'], title: '-하다', label: 'be (makes an adjective)', category: 'Suffix', note: 'Turns a root or noun into an adjective: 깨끗 → 깨끗하다 "clean".' },
  { id: 'become-suffix', keys: ['되/XSV'], title: '-되다', label: 'be done (passive)', category: 'Suffix', note: 'Passive of a -하다 verb: 시작하다 "start (something)" → 시작되다 "be started".' },
  { id: 'cause-suffix', keys: ['시키/XSV'], title: '-시키다', label: 'make (someone) do', category: 'Suffix', note: 'Causative of a -하다 verb: 교육시키다 "have (someone) educated".' },
]

export const PATTERNS: GrammarPattern[] = [
  { id: 'you-know', seq: ['지/EC', '않/VX'], contracted: true, title: '-잖아(요)', label: 'You Know', category: 'Expression', note: 'Reminds the listener of something they already know, or should: 내가 말했잖아 "I told you, didn\'t I". Contracted from -지 않아(요), but it no longer means "not".' },
  { id: 'right', seq: ['지/EC', '않/VX', 'ㄹ까|ㄹ까요|나|나요/EF'], title: '-지 않을까(요)', label: 'Wouldn\'t It…?', category: 'Expression', note: 'A soft guess put as a negative question: 비가 오지 않을까요? "Won\'t it rain, do you think?"' },
  { id: 'just-because', seq: ['다고|ㄴ다고/EC', '하/VV|VX', '어서/EC'], title: '-다고 해서', label: 'Even Though / Just because', category: 'Expression', note: '"Just because (X) doesn\'t mean…". Usually followed by a negative: 비싸다고 해서 다 좋은 건 아니다.' },
  { id: 'can', seq: ['ㄹ/ETM', '수/NNB', '있/VA|VV|VX'], title: '-(으)ㄹ 수 있다', label: 'Can Do', category: 'Expression', note: 'Ability or possibility: 할 수 있다 "can do". Often with a particle: 할 수가 있다, 할 수도 있다 "might".' },
  { id: 'cannot', seq: ['ㄹ/ETM', '수/NNB', '없/VA'], title: '-(으)ㄹ 수 없다', label: 'Cannot', category: 'Expression', note: 'Inability or impossibility: 갈 수 없다 "can\'t go".' },
  { id: 'can-p', seq: ['ㄹ/ETM', '수/NNB', '가|도|는/JKS|JX', '있/VA|VV|VX'], title: '-(으)ㄹ 수(가/도) 있다', label: 'Can / Might', category: 'Expression', note: 'Ability or possibility; with 도, "might (also)".' },
  { id: 'cannot-p', seq: ['ㄹ/ETM', '수/NNB', '가|도|는/JKS|JX', '없/VA'], title: '-(으)ㄹ 수(가/도) 없다', label: 'Cannot', category: 'Expression', note: 'Inability or impossibility, stressed by the particle.' },
  { id: 'will-prob', seq: ['ㄹ/ETM', '것/NNB', '이/VCP'], title: '-(으)ㄹ 것이다', label: 'Will / Probably', category: 'Expression', note: 'Future or a confident guess: 내일 비가 올 것이다 "it will (probably) rain tomorrow". Spoken: -ㄹ 거예요.' },
  { id: 'seems', seq: ['ㄴ|는|ㄹ/ETM', '것|거/NNB', '같/VA'], title: '-는 것 같다', label: 'It Seems', category: 'Expression', note: '"It seems / I think": 비가 오는 것 같다. Softens statements, very common in speech.' },
  { id: 'when', seq: ['ㄹ/ETM', '때/NNG'], title: '-(으)ㄹ 때', label: 'When', category: 'Expression', note: '"When / at the time of": 어릴 때 "when (I) was young".' },
  { id: 'because-gi', seq: ['기/ETN', '때문/NNB'], title: '-기 때문에', label: 'Because', category: 'Expression', note: 'Reason, a bit formal: 비가 오기 때문에 "because it is raining". Not used before commands.' },
  { id: 'in-order', seq: ['기/ETN', '위하/VV'], title: '-기 위해(서)', label: 'In Order To', category: 'Expression', note: 'Purpose: 살을 빼기 위해 운동한다 "exercises to lose weight".' },
  { id: 'decide', seq: ['기/ETN', '로/JKB', '하/VV|VX'], title: '-기로 하다', label: 'Decide To', category: 'Expression', note: 'Decision or agreement: 내일 만나기로 했다 "(we) decided to meet tomorrow".' },
  { id: 'progressive', seq: ['고/EC', '있/VX'], title: '-고 있다', label: 'Progressive (‑ing)', category: 'Auxiliary', note: 'Action in progress: 먹고 있다 "is eating". Also ongoing states from wearing verbs (입고 있다 "is wearing").' },
  { id: 'progressive-hon', seq: ['고/EC', '계시/VX'], title: '-고 계시다', label: 'Progressive (honorific)', category: 'Auxiliary', note: 'Honorific -고 있다, when the subject is someone you respect.' },
  { id: 'resultant', seq: ['어/EC', '있/VX'], title: '-아/어 있다', label: 'Be In a State', category: 'Auxiliary', note: 'The state that results from an action continues: 앉아 있다 "is sitting (seated)", 열려 있다 "is open".' },
  { id: 'not', seq: ['지/EC', '않/VX'], title: '-지 않다', label: 'Not', category: 'Auxiliary', note: 'Long negation: 먹지 않다 "does not eat". Same as 안 + verb, a bit more formal.' },
  { id: 'cannot-ji', seq: ['지/EC', '못하/VX'], title: '-지 못하다', label: 'Cannot', category: 'Auxiliary', note: 'Inability: 가지 못했다 "couldn\'t go". Same as 못 + verb.' },
  { id: 'dont', seq: ['지/EC', '말/VX'], title: '-지 말다', label: "Don't", category: 'Auxiliary', note: 'Negative command or suggestion: 가지 마세요 "please don\'t go".' },
  { id: 'become', seq: ['어/EC', '지/VX'], title: '-아/어지다', label: 'Become / Be Done', category: 'Auxiliary', note: 'With adjectives, "become": 추워지다 "get cold". With verbs, passive: 만들어지다 "be made".' },
  { id: 'for-someone', seq: ['어/EC', '주/VX'], title: '-아/어 주다', label: 'Do For (someone)', category: 'Auxiliary', note: 'Doing something for someone\'s benefit: 도와주다 "help (for you)", 사 주다 "buy for".' },
  { id: 'for-someone-hum', seq: ['어/EC', '드리/VX'], title: '-아/어 드리다', label: 'Do For (humble)', category: 'Auxiliary', note: 'Humble form of -아/어 주다, when doing something for someone you respect.' },
  { id: 'try', seq: ['어/EC', '보/VX'], title: '-아/어 보다', label: 'Try Doing', category: 'Auxiliary', note: 'Try something (for the experience): 먹어 보다 "try eating". Past: "have done before".' },
  { id: 'completely', seq: ['어/EC', '버리/VX'], title: '-아/어 버리다', label: 'Completely / End Up', category: 'Auxiliary', note: 'The action is complete, often with relief or regret: 다 먹어 버렸다 "ate it all up".' },
  { id: 'in-advance', seq: ['어/EC', '놓/VX'], title: '-아/어 놓다', label: 'Do In Advance', category: 'Auxiliary', note: 'Do something and leave it in that state, often in preparation: 예약해 놓다 "make a reservation (ahead)".' },
  { id: 'keep', seq: ['어/EC', '두/VX'], title: '-아/어 두다', label: 'Keep (done)', category: 'Auxiliary', note: 'Like -아/어 놓다: do and keep the result: 적어 두다 "write down (for later)".' },
  { id: 'up-to-now', seq: ['어/EC', '오/VX'], title: '-아/어 오다', label: 'Have Been Doing', category: 'Auxiliary', note: 'An action continuing from the past up to now: 10년 동안 일해 왔다.' },
  { id: 'from-now', seq: ['어/EC', '가/VX'], title: '-아/어 가다', label: 'Keep Doing (on)', category: 'Auxiliary', note: 'An action continuing from now into the future, or a gradual change: 익어 가다 "be ripening".' },
  { id: 'through', seq: ['어/EC', '내/VX'], title: '-아/어 내다', label: 'Manage To / Through', category: 'Auxiliary', note: 'Achieving something difficult to the end: 참아 내다 "endure it".' },
  { id: 'go-on', seq: ['어/EC', '나가/VX'], title: '-아/어 나가다', label: 'Go On Doing', category: 'Auxiliary', note: 'Steady progress onward: 해결해 나가다 "keep solving".' },
  { id: 'keep-on', seq: ['어/EC', '대/VX'], title: '-아/어 대다', label: 'Keep Doing (a lot)', category: 'Auxiliary', note: 'Repeated or excessive action: 울어 대다 "keep crying".' },
  { id: 'want', seq: ['고/EC', '싶/VX'], title: '-고 싶다', label: 'Want To', category: 'Auxiliary', note: '"Want to" for the speaker or listener: 가고 싶다. For others use -고 싶어 하다.' },
  { id: 'end-up', seq: ['고/EC', '말/VX'], title: '-고 말다', label: 'End Up', category: 'Auxiliary', note: 'Something finally happens, often against one\'s wishes: 울고 말았다 "ended up crying".' },
  { id: 'after-finish', seq: ['고/EC', '나/VX'], title: '-고 나다', label: 'After Finishing', category: 'Auxiliary', note: 'After completing an action: 먹고 나서 "after eating".' },
  { id: 'must-do', seq: ['어야/EC', '하|되/VX|VV'], title: '-아/어야 하다', label: 'Must / Have To', category: 'Auxiliary', note: 'Obligation: 가야 한다 "have to go". 되다 is more casual.' },
  { id: 'may', seq: ['어도/EC', '되/VV|VX'], title: '-아/어도 되다', label: 'May / It\'s OK To', category: 'Auxiliary', note: 'Permission: 들어가도 돼요? "may I come in?".' },
  { id: 'make-do', seq: ['게/EC', '하/VX|VV'], title: '-게 하다', label: 'Make / Let (someone)', category: 'Auxiliary', note: 'Causative: 웃게 하다 "make (someone) laugh".' },
  { id: 'come-to', seq: ['게/EC', '되/VX|VV'], title: '-게 되다', label: 'Come To / End Up', category: 'Auxiliary', note: 'A change that happens through circumstances rather than choice: 알게 되다 "come to know".' },
  { id: 'intend-to', seq: ['려고/EC', '하/VX|VV'], title: '-(으)려고 하다', label: 'Plan To / Be About To', category: 'Auxiliary', note: 'Intention, or something about to happen: 비가 오려고 한다 "it\'s about to rain".' },
  { id: 'used-to', seq: ['곤/EC', '하/VX|VV'], title: '-곤 하다', label: 'Used To', category: 'Auxiliary', note: 'Repeated habit: 산책을 하곤 했다 "used to take walks".' },
  { id: 'reported', seq: ['다고|ㄴ다고|라고/EC', '하/VV|VX'], title: '-다고 하다', label: 'They Say That', category: 'Expression', note: 'Reported speech: 비가 온다고 한다 "they say it will rain". Spoken: -대요.' },
  { id: 'have-done', seq: ['ㄴ/ETM', '적/NNB', '이|도/JKS|JX', '있|없/VA'], title: '-(으)ㄴ 적이 있다', label: 'Have Ever Done', category: 'Expression', note: 'Past experience: 가 본 적이 있다 "have been there". With 없다, "have never".' },
  { id: 'almost', seq: ['ㄹ/ETM', '뻔/NNB', '하/XSV|VX|VV'], title: '-(으)ㄹ 뻔하다', label: 'Almost', category: 'Expression', note: 'Something nearly happened (but did not): 넘어질 뻔했다 "almost fell".' },
  { id: 'know-how', seq: ['ㄹ/ETM', '줄/NNB', '알|모르/VV'], title: '-(으)ㄹ 줄 알다', label: 'Know How To', category: 'Expression', note: 'Know how to do something: 수영할 줄 알다. With 모르다, "not know how".' },
  { id: 'in-middle', seq: ['는/ETM', '중/NNB'], title: '-는 중', label: 'In the Middle Of', category: 'Expression', note: '"Be in the middle of": 가는 중이다 "on my way".' },
  { id: 'while-still', seq: ['ㄴ|는/ETM', '채/NNB'], title: '-(으)ㄴ 채(로)', label: 'With … Still', category: 'Expression', note: 'Keeping a state while doing something else: 신발을 신은 채로 "with shoes on".' },
  { id: 'due-to', seq: ['는/ETM', '바람/NNB'], title: '-는 바람에', label: 'Because Of (unexpected)', category: 'Expression', note: 'An unexpected cause with a negative result: 늦잠을 자는 바람에 지각했다.' },
  { id: 'bound-to', seq: ['기/ETN', '마련/NNB'], title: '-기 마련이다', label: 'Bound To', category: 'Expression', note: 'Something naturally happens: 사람은 실수하기 마련이다 "people are bound to make mistakes".' },
  { id: 'just-only', seq: ['ㄹ/ETM', '뿐/NNB'], title: '-(으)ㄹ 뿐', label: 'Only / Merely', category: 'Expression', note: '"Merely, nothing more than": 웃을 뿐이다 "(they) just laugh".' },
  { id: 'must-not', seq: ['면/EC', '안/MAG', '되/VV|VX'], title: '-(으)면 안 되다', label: 'Must Not', category: 'Expression', note: 'Prohibition: 여기서 담배를 피우면 안 된다 "you must not smoke here".' },
]
