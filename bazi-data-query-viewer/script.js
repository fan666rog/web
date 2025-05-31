document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements for main query
    const shengxiaoSelect = document.getElementById('shengxiaoSelect');
    const ganzhiSelect = document.getElementById('ganzhiSelect');
    const monthSelect = document.getElementById('monthSelect');
    const daySelect = document.getElementById('daySelect');
    const hourMainSelect = document.getElementById('hourMainSelect');
    const hourDetailSelect = document.getElementById('hourDetailSelect');
    const queryButton = document.getElementById('queryButton');
    const resetButton = document.getElementById('resetButton');
    const resultSectionDiv = document.getElementById('resultSection');
    const resultOutputDiv = document.getElementById('resultOutput');

    // DOM Elements for full data view
    const mainQueryAndControlsSection = document.querySelector('.query-section');
    const mainQueryControls = document.querySelector('.selection-area'); // The actual selection inputs area
    const fullViewControlsSection = document.querySelector('.full-view-controls');
    const fullDataViewSection = document.getElementById('fullDataViewSection');
    const fullDataViewTitle = document.getElementById('fullDataViewTitle');
    const fullDataViewOutput = document.getElementById('fullDataViewOutput');
    const backToMainQueryBtn = document.getElementById('backToMainQueryBtn');

    // --- 1. Data storage - 在下方貼上您的 JSON 資料 ---

    const yearData =
[
  {
    "ganzhi": "甲子",
    "shengxiao": "鼠",
    "wuxing": "金",
    "description": "為人多學小成，有始無終，心性暴躁，幼年多災，重拜父母保養，兄弟骨肉小靠，子多刑，男人妻大，女人夫長，可謂伶俐聰明賢能之命"
  },
  {
    "ganzhi": "乙丑",
    "shengxiao": "牛",
    "wuxing": "金",
    "description": "為人慷慨，喜愛春風，見事多學少成，幼災父母重拜，九流中人，夫妻無刑，兒女不孤，六親少靠，女人賢良，純和之命"
  },
  {
    "ganzhi": "丙寅",
    "shengxiao": "虎",
    "wuxing": "火",
    "description": "為人多學少成，心性不定，口快舌硬，身閒心直，手足不停不止，利官近貴，女人賢良，曉事聰明伶俐之命"
  },
  {
    "ganzhi": "丁卯",
    "shengxiao": "兔",
    "wuxing": "火",
    "description": "為人手足不停，身心不閒，衣祿不少，性巧聰明，做事有頭無尾，女人稟性好靜，一生安允有幸，男人福分之命"
  },
  {
    "ganzhi": "戊辰",
    "shengxiao": "龍",
    "wuxing": "木",
    "description": "為人喜氣春風，出入壓群眾，利官近貴，骨肉刑傷兒女不孤之命，女人溫良賢達，有口無心，主招好夫之命"
  },
  {
    "ganzhi": "己巳",
    "shengxiao": "蛇",
    "wuxing": "木",
    "description": "為人聰明伶俐，有功名之分，夫妻和順，做事如意，牛田有分，女人衣食不少，賢良待人，男人多出風頭，善有計謀，英敏飲才，福厚之命"
  },
  {
    "ganzhi": "庚午",
    "shengxiao": "馬",
    "wuxing": "土",
    "description": "為人口快心宜，利官近貴，衣祿豐盈，男人權柄持家，女人榮夫益子，秀氣之命格，男人有帶固執之性格，注重欠點，受人敬佩之命"
  },
  {
    "ganzhi": "辛未",
    "shengxiao": "羊",
    "wuxing": "土",
    "description": "為人有志你，本生性寬，少年多災，頭見女吉，生男有刑，夫妻和順，女人持家興旺，男人有建家立業，各顯榮幸之命"
  },
  {
    "ganzhi": "壬申",
    "shengxiao": "猴",
    "wuxing": "金",
    "description": "為人性巧聰明，機謀多變，和氣春風，功名有分，更招賢德之妻，男人多受人敬愛，姿性英敏，女人美容艷麗，富貴之命"
  },
  {
    "ganzhi": "癸酉",
    "shengxiao": "雞",
    "wuxing": "金",
    "description": "為人心直公平，一生口便舌能，有藏衣祿，平穩足用，六親冷淡，須事不中，為人平等，不貪不取，晚景旺相，女人助夫興家立業之命"
  },
  {
    "ganzhi": "甲戌",
    "shengxiao": "狗",
    "wuxing": "火",
    "description": "為人口快舌便，身閒心不閒，有權柄智謀，為名聲遠播，福祿有餘，女人旺夫，生財之命"
  },
  {
    "ganzhi": "乙亥",
    "shengxiao": "豬",
    "wuxing": "火",
    "description": "為人和順，幼年多災，父母有刑，重拜無害，夫婦和合，偕老齊眉，存心中正，中年末歲，財穀興旺，子女有剋，見遲方好"
  },
  {
    "ganzhi": "丙子",
    "shengxiao": "鼠",
    "wuxing": "水",
    "description": "為人膽大，有權柄及謀略，早年平平，中年成就，晚景大好，做事按機，女人饒舌絮刮之命，言多必失，守己安分，幸福自來"
  },
  {
    "ganzhi": "丁丑",
    "shengxiao": "牛",
    "wuxing": "水",
    "description": "為人和睦，衣祿不少，初年有財祿常在，晚景有剩骨肉，頭女無情遲好，夫妻和順，女人旺夫，持家賢良之命"
  },
  {
    "ganzhi": "戊寅",
    "shengxiao": "虎",
    "wuxing": "土",
    "description": "為人猛烈，易快易冷，反目無情，早年勤儉，離祖發達，主有聰明伶俐，守其和平，以禮待人，晚年大有良機，幸福之命"
  },
  {
    "ganzhi": "己卯",
    "shengxiao": "兔",
    "wuxing": "土",
    "description": "為人風流，一生衣祿豐足，自然善閒遊，嬉戲不受人欺，六親冷淡，骨肉難為，妻招年長，配偶和合，女人與鄰睦和，親族賢達，長壽之命"
  },
  {
    "ganzhi": "庚辰",
    "shengxiao": "龍",
    "wuxing": "金",
    "description": "為人春風和氣，勞碌雪霜一生，利官近貴，夕利雙全，衣食足用，中年平順，晚年大興，女人勤儉，操持之命"
  },
  {
    "ganzhi": "辛巳",
    "shengxiao": "蛇",
    "wuxing": "金",
    "description": "為人有機謀，多隨機應變，志氣過人，衣食足用，貴人扶助，中年和順，老運發財發福，長壽之命"
  },
  {
    "ganzhi": "壬午",
    "shengxiao": "馬",
    "wuxing": "木",
    "description": "為人勤儉，父母刑傷，災厄可折，早年有財物不聚，晚景旺相，事應積蓄，防備乏旱，女人興家，賢能之命"
  },
  {
    "ganzhi": "癸未",
    "shengxiao": "羊",
    "wuxing": "木",
    "description": "為人心急口快，須事伶俐，救人無恩情，反招是非多，只好休管他人事，有財無庫，財來財去，重物質，造基礎，女人賢德持家，初年起晚景平安之命"
  },
  {
    "ganzhi": "甲申",
    "shengxiao": "猴",
    "wuxing": "水",
    "description": "為人衣祿不少，心性溫柔，出入壓眾，初年顛倒，晚歲利達，興家豐隆，夫妻和合，兒女見犀，女人操持興旺，榮隆之命"
  },
  {
    "ganzhi": "乙酉",
    "shengxiao": "雞",
    "wuxing": "水",
    "description": "為人口快心直，土氣軒昂，衣祿足用，福壽雙全，兄弟雖有難為得力，六親和睦，女人興財綿遠，平穩之命"
  },
  {
    "ganzhi": "丙戌",
    "shengxiao": "狗",
    "wuxing": "土",
    "description": "為人豪傑和順，招財得寶，自立家業，前運勤勞，晚年榮華，清榮高氣，女人老年尚好，血財旺相之命"
  },
  {
    "ganzhi": "丁亥",
    "shengxiao": "豬",
    "wuxing": "土",
    "description": "為人性巧聰明，自立自營，兒女有刑，見遲方好，生平好做善事，財源旺相，女人衣祿平穩，主有天財之命"
  },
  {
    "ganzhi": "戊子",
    "shengxiao": "鼠",
    "wuxing": "火",
    "description": "為人計算聰明，精通文武，早生兒女剋，晚生保平安，夫妻和順，有財益之命，晚年大興旺相，女人賢良，發達之命"
  },
  {
    "ganzhi": "己丑",
    "shengxiao": "牛",
    "wuxing": "火",
    "description": "為人口快心直，通文藝有才能，衣祿不少，男人有再娶，花燭重明之嫌，後來夫妻和睦，百年偕老，晚年發福之命"
  },
  {
    "ganzhi": "庚寅",
    "shengxiao": "虎",
    "wuxing": "木",
    "description": "為人心性急，有口無心，有事大藏，易好意怒，反覆無常，衣食豐足，財物早年耗散不聚，晚景豐隆，女人有內助旺相之命"
  },
  {
    "ganzhi": "辛卯",
    "shengxiao": "兔",
    "wuxing": "木",
    "description": "為人口快心直，有志氣權柄，利官近貴，身閒心不閒，六親少靠，自立成家，少年勞碌，晚年大利，女人操持家庭興隆之命"
  },
  {
    "ganzhi": "壬辰",
    "shengxiao": "龍",
    "wuxing": "水",
    "description": "為人勞碌，手足無時停，早年難守，財來財去，不聚財寶，有虛無實，晚景發財發福，女有操持旺相之命"
  },
  {
    "ganzhi": "癸巳",
    "shengxiao": "蛇",
    "wuxing": "水",
    "description": "為人伶俐聰明，財谷聚散，主近貴人，中年風霜，春風之徒，守己暫發福，三勝時敗，被人反睦，晚景榮華賢良之命"
  },
  {
    "ganzhi": "甲午",
    "shengxiao": "馬",
    "wuxing": "金",
    "description": "為人和氣，喜好春風，交朋群友，利官近貴，遇凶不為凶，逢凶化吉，骨肉少靠，女人口快能言，多出風刺之命"
  },
  {
    "ganzhi": "乙未",
    "shengxiao": "羊",
    "wuxing": "金",
    "description": "為人容貌端正，少年勤儉，初年平順，兄弟少靠，子息不孤，立家興隆，晚年大有財聚，女人持家相夫益子之命"
  },
  {
    "ganzhi": "丙申",
    "shengxiao": "猴",
    "wuxing": "火",
    "description": "為人衣食足用，交易買賣，利路亨通，自有生財，牛田有分，早年勞碌，晚景興旺，女人犧牲血財，持家旺相發達之命"
  },
  {
    "ganzhi": "丁酉",
    "shengxiao": "雞",
    "wuxing": "火",
    "description": "為人好春風，多情重恩，利官近貴，初年勞碌，身閒心苦，晚景家道興隆，女人清秀命，半夫半財，老歲吉昌之格"
  },
  {
    "ganzhi": "戊戌",
    "shengxiao": "狗",
    "wuxing": "木",
    "description": "為人和氣，自營自立，早年顛倒，財穀耗散，晚景得財，宜拜師學藝，工夫之命，立業能而成功，財源廣近，利路亨通，女人養育中平之命"
  },
  {
    "ganzhi": "己亥",
    "shengxiao": "豬",
    "wuxing": "木",
    "description": "為人巧計伶俐，衣食安穩，骨肉少力，六親冷淡，兒女早見刑剋，夫妻和順，女人清閒，晚年發達之命"
  },
  {
    "ganzhi": "庚子",
    "shengxiao": "鼠",
    "wuxing": "土",
    "description": "為人尊重安穩，一生衣祿無虧，主妻賢明，持家有權柄，須事能通達，遇凶化吉，貴人提拔，女人興旺，蔭家之命"
  },
  {
    "ganzhi": "辛丑",
    "shengxiao": "牛",
    "wuxing": "土",
    "description": "為人心性溫和，初限有驚恐之厄，雖有衣祿財帛，進退骨肉少力，晚景福壽延長，女命喜血財旺相之命"
  },
  {
    "ganzhi": "壬寅",
    "shengxiao": "虎",
    "wuxing": "金",
    "description": "為人口快心直，有事不藏，男女早婚不宜，夫妻便剋，兒女見遲，初年做事顛倒，中年與晚年財帛足用，女人養蓄如意發福之命"
  },
  {
    "ganzhi": "癸卯",
    "shengxiao": "兔",
    "wuxing": "金",
    "description": "為人酒食不少，福祿有餘，凶中化吉，早年財帛不聚，多收入多支出，晚景興隆，女人中年與晚景多犧牲利益，保持之命"
  },
  {
    "ganzhi": "甲辰",
    "shengxiao": "龍",
    "wuxing": "火",
    "description": "為人衣食豐足，一生清閒，早年平平，中末年豐厚有餘，骨肉相親難靠，對自己所想事業經營，廿年間可以發達之命"
  },
  {
    "ganzhi": "乙巳",
    "shengxiao": "蛇",
    "wuxing": "火",
    "description": "為人氣象端正，喜好春風，只帶指背煞，救人無功，做好不說，早年子女刑剋，晚得安寧，女人有發達，相夫益子之命"
  },
  {
    "ganzhi": "丙午",
    "shengxiao": "馬",
    "wuxing": "水",
    "description": "為人清閒，初年財帛耗散，心主不憂不住，宜做手藝工夫生意，不利求名，兄弟各自成家，後運發財興旺，女人清奇巧妙之命"
  },
  {
    "ganzhi": "丁未",
    "shengxiao": "羊",
    "wuxing": "水",
    "description": "為人喜怒不常，一生口舌能便，名利有分，衣祿皆足骨肉疏，遠子息遲，見女人晚景興旺，助夫益子之命"
  },
  {
    "ganzhi": "戊申",
    "shengxiao": "猴",
    "wuxing": "土",
    "description": "為人性急，做事反覆，一生勞碌辛苦，利官見貴，做事如意，百事皆通，凡事寬量，心重為吉，女人子息不孤之命"
  },
  {
    "ganzhi": "己酉",
    "shengxiao": "雞",
    "wuxing": "土",
    "description": "為人心性聰明，衣祿有足，六親難靠，兒女早見，做事如意，百事皆通，凡事寬量，心重為吉，女人計較多變，無災厄之命"
  },
  {
    "ganzhi": "庚戌",
    "shengxiao": "狗",
    "wuxing": "金",
    "description": "為人快活，丑年有災，利官近貴，做事敏捷，百事如意，勤儉勵業，福在晚年，犯指背煞，救人無義，如人心賢能事，興旺之命"
  },
  {
    "ganzhi": "辛亥",
    "shengxiao": "豬",
    "wuxing": "金",
    "description": "為人不惹閒事，百事謀求，早年不聚財物，晚景慶良機，可謂榮華富貴之命，女人豐福，立業之命"
  },
  {
    "ganzhi": "壬子",
    "shengxiao": "鼠",
    "wuxing": "木",
    "description": "為人幼年有災，中年衣食足用，男招好妻，身閒心苦，多喜多憂，兄弟少力，六親冷淡，凡事自做自為，女人賢能之命"
  },
  {
    "ganzhi": "癸丑",
    "shengxiao": "牛",
    "wuxing": "木",
    "description": "為人衣祿不少，財帛早年不聚，一生尊重，不惹事非，父母難為，骨肉少靠，夫妻和順，兒女見遲，早宜過房之命"
  },
  {
    "ganzhi": "甲寅",
    "shengxiao": "虎",
    "wuxing": "水",
    "description": "為人誠實，一生利官近貴，家道興寧，衣食足用，財帛多招，父母有刑，重拜雙親，女人管夫，男人怕妻，命硬三分，子息長"
  },
  {
    "ganzhi": "乙卯",
    "shengxiao": "兔",
    "wuxing": "水",
    "description": "為人志氣軒昂，計較巧妙，求一生近貴，百事如意，文武皆通，女人福壽無虧之命"
  },
  {
    "ganzhi": "丙辰",
    "shengxiao": "龍",
    "wuxing": "土",
    "description": "為人聰明伶俐，四海春風，一生衣祿無虧，身閒心勞，好交朋友，中年事業興隆，間景財旺，女人賢能之命"
  },
  {
    "ganzhi": "丁巳",
    "shengxiao": "蛇",
    "wuxing": "土",
    "description": "為人利官近貴，稟性剛強，不順人情，兄弟居長，事業顯榮，女人容貌美麗，衣食豐足，賢達起家之命"
  },
  {
    "ganzhi": "戊午",
    "shengxiao": "馬",
    "wuxing": "火",
    "description": "為人志氣寬宏，一生衣祿自然，容貌端正，溫良性格，少年多災，骨肉有刑，女人姊妹少靠，大有興旺之命"
  },
  {
    "ganzhi": "己未",
    "shengxiao": "羊",
    "wuxing": "火",
    "description": "為人口快舌硬，衣祿自來，前程顯達，得貴人欽敬，財帛旺相，百事榮昌強公勝祖，朋友尊重，旺相之命"
  },
  {
    "ganzhi": "庚申",
    "shengxiao": "猴",
    "wuxing": "木",
    "description": "為人一生手足不住停，名行清高，利官近貴，命犯指背煞，做好不得好，救人無功勞，女人立志興家，六親冷淡，晚景興隆之命"
  },
  {
    "ganzhi": "辛酉",
    "shengxiao": "雞",
    "wuxing": "木",
    "description": "為人一生伶俐，精神清爽，口能舌便，高人敬重，財帛足用，六親冷淡，骨肉情疏，女人賢德，操持興家之命"
  },
  {
    "ganzhi": "壬戌",
    "shengxiao": "狗",
    "wuxing": "水",
    "description": "為人一生好行善事，東來西去不住不停，多勞多管，衣食不缺，貴人提拔，百事稱意，早年平常，晚年興旺，女人善能操持賢良之命"
  },
  {
    "ganzhi": "癸亥",
    "shengxiao": "豬",
    "wuxing": "水",
    "description": "為人剛直，不順人情，財谷如意，六親疏遠，自立權衡，晚景勝前興，創家之命女人持家牲畜旺相，享福延壽之命"
  }
]   ;

    const monthData =
{
  "正月": {
    "description": "此月生人，前年四月受胎，立春節後出生\n為人忠厚，富有義心，仁德待人，同情心深，成人之美，犧牲自己，具帶神經質，而對事干難，亦重感情破前程，近官吏敬重，富貴增榮，大事小成，凡事仔細，能招四方財，幼年平常，中年運開，晚年榮富，無剋之命。",
    "poem": "相貌端正是前緣，早年衣祿自安然。貴人接引鴻運路，夫婦團圓過百年。"
  },
  "二月": {
    "description": "此月生人，前年五月受胎，驚直節後出生\n性情溫良，為人誠實，出言無毒，善作陰德，諸事謙尊，六親少靠，成功如登梯，貪急失敗，隨機行事，萬事安然，初限辛苦，中年發達，四十興榮，終年利路亨通，假虛半真之命。",
    "poem": "平生良善自有持，衣祿增榮盛有餘。錢財家業中年好，貴人提拔上雲梯。"
  },
  "三月": {
    "description": "此月生人，前年六月受胎，清明節後出生\n人心不凡，內心強固，腦智明晰，交際巧妙，寬宏大量，事應忍耐與奮鬥，乘得良機，重色情破前程，為情色害良緣，宜要謹慎得榮幸，三十歲前逢盛運，有虛無實，財來財去，四十歲後運到自安然。須事順步，不可焦急，福祿永在。",
    "poem": "為人心性自寬懷，平生招得四方財。一旦時來當發福，猶如枯木遇春天。"
  },
  "四月": {
    "description": "此月生人，前年七月受胎，立夏節後出生\n廣交朋友，學藝術能成功，多才巧智，欲望過大，心性難定，宜奮鬥終得發達，義俠心強，犧牲自己，敗強助弱，常造敵城，後果逢貴提拔，聲名揚振，三十七歲後發展，為頭目之人。",
    "poem": "一年喜樂一年憂，無須怨恨如憂愁。最宜持濟行方便，夫婦快樂得團圓。"
  },
  "五月": {
    "description": "此月生人，前年八月受胎，芒種節後出生\n為人善良，心情溫和伶俐，有權有勢，行而正道，自為成功，恐對事虎頭蛇尾，無忍耐性，遇良機不能得，離祖成家，婚遲為吉，夫婦半途，三十一歲或三十五歲後，可能大得利益。",
    "poem": "自出常遇見橫財，上人接引笑顏開。田園產業家富豪，榮華富貴步金階。"
  },
  "六月": {
    "description": "此月生人，前年九月受胎，小暑節後出生\n為人遠達，心巧伶俐，藝術多能，思慮緻密，肯努力與堅定心者，終為大發達，貪小利失大財，勿剛情失和平，為色情破家庭，難得祖業，白手成家，初限難為，中年平順，未運富貴。",
    "poem": "一生衣祿人安康，為人顯達有文光。三春快樂蓄家富，夫妻同居松柏長。"
  },
  "七月": {
    "description": "此月生人，前年十月受胎，立秋節後出生\n心地慈善，做事仔細，外剛內柔，為人親切，意志堅固，做事始終，少年辛苦，初緣破敗，對予女煩惱，陰人小心，中年後開泰，晚年家庭圓滿，財源大旺。",
    "poem": "為人一生不須憂，少小定心有根由。家宅田園宜主管，方知福祿不待求。"
  },
  "八月": {
    "description": "此月生人，前年十一月受胎，白露節後出生\n眼力光輝，文章顯達，記憶機敏，創造有巧妙，四方多藝，獨立不宜，合夥成事，正直無私，初限幸福，中年雜亂，不意中失敗，晚年福祿濟美。",
    "poem": "為人端正貌堂堂，皆因前世性溫良。今生宜多行善事，自然福祿壽綿長。"
  },
  "九月": {
    "description": "此月生人，前年十二月受胎，寒露節後出生\n廣招四方財，智慧銳敏奇，恐怕聰明誤，失去得仁禾，宜養溫柔心，自然貴人扶，檢討過去事，努力前程福，自得有權柄，子孫亦興隆，四十而大發，事事順利到，晚景大有機，幸福天相臨。",
    "poem": "此人生後得大財，錢財賣盡又送來。八字好星家富豪，衣祿自然稱心懷。"
  },
  "十月": {
    "description": "此月生人，前年正月受胎，立冬節後出生\n為人意志剛，技術有巧妙，男女多相剋，夫婦難和睦，心情易變動，招來失敗路，矯正橫逆理，自然得人尊，初限不理想，晚景安逸棲。",
    "poem": "為人年年慶豐餘，免得災殃禍其身。更宜持齋行善事，一生衣祿勝三春。"
  },
  "十一月": {
    "description": "此月生人，前年二月受胎，大雪節後出生\n性急兼伶俐，近貴多計較，易招障害至，只好得人和，做事可安居，自得名譽位，初限有難為，中年多認真，恐怕色情災，勤儉有慶餘，晚運大有慶是在子孫福。",
    "poem": "自宜早年成立家，生平衣祿有榮華。親戚兄弟全無靠，交換好友勝有他。"
  },
  "十二月": {
    "description": "此月生人，前年三月受胎，小寒節後出生\n為人心直口快，兄弟難可靠，自愁自憂悶，出外風光好，自得四方財，衣祿有足餘，多管他人事，愛顧他人心，受友如鶴群，抱負如天大，志氣像大梅，貧者貧字凳。失敗之根本，初年有其福，中年多辛勞，晚景大吉昌，此是人間福。",
    "poem": "初限勤勞受苦辛，自然末後不求人。好運來時福祿至，夫婦團圓壽百春。"
  }
}   ;

    const dayData =
[
  {
    "date": "初一日",
    "description": "此日生人，福祿雙全，財星拱照，受人引進，事業發達，大有良機，初年平常，中年運到，利路亨通，春風虛榮，失敗前兆，晚景榮幸，女人旺夫，發福之命。"
  },
  {
    "date": "初二日",
    "description": "此日生人，性格善良，與人和睦，身體建康，家族緣薄，離祖成家，青年辛苦，兄弟難靠，獨立生計，中年運開，財源廣進，男主清奇，女主聰明，成立之命。"
  },
  {
    "date": "初三日",
    "description": "此日生人，夫妻和睦，不能偕老，子息有乏，修身佈德，初年多磨，二十餘慶，受人提拔，幸運到達，四十盛運，左作右中，環境良好，榮華之命。"
  },
  {
    "date": "初四日",
    "description": "此日生人，為人多學，才智出眾，少年不宜，中運財至，在家是非，出外逢貴，夫妻和順，家庭圓滿，財源活潑，晚年吉祥，快樂之命。"
  },
  {
    "date": "初五日",
    "description": "此日生人，為人聰明，衣祿有餘，心靜伶俐，早出社會，六親無倚，兄弟和順，持有藝能，初年辛勞，中年運達，晚年安穩，無虧之命。"
  },
  {
    "date": "初六日",
    "description": "此日生人，多學少成，清閑快樂，初限富貴，中年平平，末運大旺，分別大小，與人親睦，貴人提拔，發達成功，父兄無靠，白手成家。"
  },
  {
    "date": "初七日",
    "description": "此日生人，性格複雜，多變易動，浮沉未定，波瀾風霜，二五享福，保持佳運，兄弟如意，女命福祿，守之平和，身體建全，長壽之命。"
  },
  {
    "date": "初八日",
    "description": "此日生人，性情伶俐，幸福可多，才能良器，一生安樂，平常無憂，中年成功，父母無緣，離祖成家，出外逢貴，將見樂亨，榮華之命。"
  },
  {
    "date": "初九日",
    "description": "此日生人，身體健全，性格清朗，受人敬愛，須事勉勵，勤儉行善，德被卿黨，中年平順，晚景千鐘，福分無量，名利長存，慈悲之命。"
  },
  {
    "date": "初十日",
    "description": "此日生人，為人伶俐，忠誠待人，家族緣薄，離祖成家，緣和四海，少年辛苦，中年開發，晚年大興，事業通達，藝術成功，安樂之命。"
  },
  {
    "date": "十一日",
    "description": "此日生人，富有智力，意志堅固，事有決斷，運遲開發，至中年苦，雖有橫財，不能料事，空放幸運，宜要謹慎，財源循來，福分之命。"
  },
  {
    "date": "十二日",
    "description": "此日生人，為人溫柔，刻苦耐勞，善好勤儉，多積蓄物，少年不宜，中年大吉，將見名揚，福祿雙至，晚年餘慶，家門隆興，福祿之命。"
  },
  {
    "date": "十三日",
    "description": "此日生人，金運可達，福祿有餘，遵守道德，受人敬愛，貴人提拔，命運通達，大有成功，獲得幸福，福祿雙收，女命富貴，金運之命。"
  },
  {
    "date": "十四日",
    "description": "此日生人，環境良好，為人厚重，沉靜不動，男人清秀，女子聰明，貴人得助，青年平常，努力前程，中年運開，事得順調，晚年發達，厚分之命。"
  },
  {
    "date": "十五日",
    "description": "此日生人，夫妻敬重，子孫刑剋，好爭好鬥，破害前程，為人溫柔，將來餘慶，男者離祖，他鄉發展，女人剋夫，必配硬命，陌老諧年，平常之命。"
  },
  {
    "date": "十六日",
    "description": "此日生人，為人聰明，藝術超群，琴棋達人，書詩出眾，青年勤功，中年藝精，成功發達，祖業不宜，被人批評，身閑心勞，憂悶之命。"
  },
  {
    "date": "十七日",
    "description": "此日生人，為人聰明，智力平凡，忍耐力強，少年障害，難關重來，善理措置，對兄弟薄，六親無靠，自力更生，中年大發，大有良機，發達之命。"
  },
  {
    "date": "十八日",
    "description": "此日生人，智能可畏，料事從優，自作聰明，不容他人，破害前程，性情剛過，與人不和，獨立自好，父兄無緣，晚景大運，中年平平，普通之命。"
  },
  {
    "date": "十九日",
    "description": "此日生人，名利雙收，成功異常，社會出眾，色情強破，桃唇小心，身有暗病，苦煩自嘆，防止未然，中年平平，未運福祿，榮華之命。"
  },
  {
    "date": "二十日",
    "description": "此日生人，少事多勞，心身多煩，波瀾重見，苦苦得曉，男人離祖，祖業難當，親朋無靠，出外得財，刑剋上下，有貴人助，晚景大幸，昌盛之命。"
  },
  {
    "date": "二十一日",
    "description": "此日生人，內助得力，衣祿和順，受人拔起，持有金運，喜好投機，意高膽大，不服他人，中年平平，事無全心，末境發達，晚福之命。"
  },
  {
    "date": "二十二日",
    "description": "此日生人，一生聰明，信義可喜，作事無虛，先難後易，少年干難，苦中得甘，廿五運到，良好前程，加添努力，晚景大興，名利之命。"
  },
  {
    "date": "二十三日",
    "description": "此日生人，住址常換，作事不定，多變多動，易生爭鬥，勤勵事業，矯正乏點，衣祿有餘，中年平平，未運福到，榮華富貴，平安之命。"
  },
  {
    "date": "二十四日",
    "description": "此日生人，為人伶俐，大有器才，作事專心，有頭至尾，對人親切，四處友朋，受人敬愛，好積財寶，出外逢貴，刑剋妻子，盛昌之命。"
  },
  {
    "date": "二十五日",
    "description": "此日生人，為人忠實，喜好公益，巧料家庭，專心經營，事業發達，多管他事，惕易生敵，心性未定，可得內助，晚年發達，大旺之命。"
  },
  {
    "date": "二十六日",
    "description": "此日生人，為人仁德，慈悲風態，受人愛慕，長上提拔，立身出世，先苦後甘，作事無虛，勤儉積蓄，金運滿載，幸福無疆，榮貴之命。"
  },
  {
    "date": "二十七日",
    "description": "此日生人，為人巧奇，金運緣薄，多收多出，變動無常，居所未定，出洋成功，努力奮鬥，前程有餘，身體強壯，勤儉勵業，成功之命。"
  },
  {
    "date": "二十八日",
    "description": "此日生人，青年薄運，幼年病難，獨立意志，認真作事，中年運到，積蓄金錢，自得良焉，親朋難靠，早婚刑剋，晚婚平靜，求得溫和，金運之命。"
  },
  {
    "date": "二十九日",
    "description": "此日生人，為人忠厚，肯作肯勞，重義信用，與人豪傑，慷慨待人，廣積社會，妻財有餘，初限平順，中年運到，晚年餘慶，幸福之命。"
  },
  {
    "date": "三十日",
    "description": "此日生人，性格聰明，為人活潑，春風待人，易快親睦，中正不偏，作事輕快，益助他人，犧牲自己，前途無憂，未運隆興，大旺之命。"
  }
]   ;

    const hourData =
{
  "子時": {
    "range": "(夜子夜間十一點起至十二點止，早子十二點起至上午一點止)",
    "main_description": "子時生人,此人態度愉快,性急剛過,富有勤儉,文雅動人,須事未定,平生極少,消極表現,有謀欠勇 ,多端是非,父母得力,妻子相助,朋友結合,早年發達,意志堅強,白手成家。",
    "career": "農林、工程、藝術、建築、科學、電氣、政治、屬金水事業。",
    "details": {
      "頭": {
        "description": "時頭生人母先亡,十成九敗多進退,醫術僧道總皆吉,首妻難招六親冷。",
        "poem": "生子先兒郎,子息不過變,兄弟不和順,未景管田庄。"
      },
      "中": {
        "description": "時中生人皆和順,一生作事硬佔強,七倒八起隨興旺,離祖成家得清閑。",
        "poem": "天祿雖興旺,時值掌權宮,前程防小失,作事得亨通。"
      },
      "末": {
        "description": "時末生人先送父,六親無靠自耕軀,有財無庫宜積蓄,子息恐硬須過房。",
        "poem": "子末先父亡,子息三位定,積德接傳宗,老景身安康。"
      }
    }
  },
  "丑時": {
    "range": "(上午一點起至上午三點止)",
    "main_description": "丑時生人,此人志向蓬勃,舉止靜默,極喜立功,家族緣薄,離鄉早成功,上官近貴,父母難常,性有硬氣,中年開運,四五興旺,晚年齊福。",
    "career": "商業、礦產、地質、工程、技師、教學、官吏、學者、加工、飲食等業。",
    "details": {
      "頭": {
        "description": "時頭生人身有利,一生衣祿慶有餘,榮華高貴兼安穩,子孫繁榮得佳期。",
        "poem": "晚景運限好,三子或增多,兄弟皆得力,一生衣祿和。"
      },
      "中": {
        "description": "時中生人父先亡,爲人誠實進田莊,夫婦和合子協力,晚年財帛慶豐年。",
        "poem": "丑中先防父,頭子總難招,須要防妻息,勞力大丈夫。"
      },
      "末": {
        "description": "丑末生人先母亡,有時苦衷心循忠,先苦後甘爲僧道,老年貴人自天相。",
        "poem": "丑末先剋母,女命主妨父,先男後有女,晚景貴人扶。"
      }
    }
  },
  "寅時": {
    "range": "(上午三點起至上午五點止)",
    "main_description": "寅時生人,此人稟性剛毅,目光銳利,少年多勞,艱難受苦,不于祖業刺力,浪走異鄉,十七敗害,四十發福,晚景逢貴,共享其成。",
    "career": "數學、醫學、法律學、經濟學、音樂、美術學、社會等事業。",
    "details": {
      "頭": {
        "description": "時頭生人父先亡,一生聰明智慧朗,衣食祿住依實力,如水波漲心繁忙。",
        "poem": "寅頭進田莊,兒女慶雙逢,事業中年好,晚運自能通。"
      },
      "中": {
        "description": "寅中生人雙親全,爲人作事智足權,離祖揚名進田宅,積德衣足有思源。",
        "poem": "時中孝順良,利作又吉昌,兒女滿堂榮,一生樂優長。"
      },
      "末": {
        "description": "時末生人母先皈,六親無力頭上祟,兄弟不和少勞苦,運逢中年暫榮貴。",
        "poem": "時尾繁雜多,身安心亦勞,疾厄難解定,逢運得功高。"
      }
    }
  },
  "卯時": {
    "range": "(上午五點起至上午七點止)",
    "main_description": "卯時生人,其觀察力特強,於人巧言能說深度透視,福多勞少,兄弟難靠。出外經營,五十亨通,夫妻平常,先難後得,自立成功。",
    "career": "美術、化工、機械、土木、文學、戲劇、宗教家,宜習有關哲理科學之術。",
    "details": {
      "頭": {
        "description": "時頭出世先母亡,一生作事走他方,雙親兄弟不相從,離祖血籍運能通。",
        "poem": "時頭損子息,謀事辛苦得,衣食有時變,晚年安昇日。"
      },
      "中": {
        "description": "時中生人父母全,男女成群立家寬,一生富貴有餘慶,爲人忠厚皆如願。",
        "poem": "家屋寬興隆,兄弟好商量,一生足衣祿,光明顯達重。"
      },
      "末": {
        "description": "時末出生先亡父,十成九敗多失意,勞勞碌碌難得利,晚景自然暫順序。",
        "poem": "未至途程涉,發揮汗流洽,六親不相助,獨立進家業。"
      }
    }
  },
  "辰時": {
    "range": "(上午七點起至上午九點止)",
    "main_description": "辰時生人,性格溫和聰明伶俐,行止彬彬有裡心志強固,資事急烈衣祿光輝,女人孤獨,不暇自顧,自信過重,不合之點,自宜戒之。",
    "career": "多才多藝、書畫音樂、政治教學、裝飾雕刻、鐮業金石、美術之學藝。",
    "details": {
      "頭": {
        "description": "時頭出生父母在,六親互助兄弟開,心慈心急多手藝,四十過後福暫來。",
        "poem": "衣祿自當來,長房不得利"
      },
      "中": {
        "description": "時中生人先送父,爲人公道性直急,兄弟六親情疏遠,離籍立業貴人扶。",
        "poem": "衣住得人栽,六親雖冷谈,先勞後花開,末限進家財。"
      },
      "末": {
        "description": "時末生人母先登,爲人伶俐財祿傾,手足有顧六親旺,富貴親民官高昇。",
        "poem": "福份自然生,時期人遵敬,祖業守如在,富貴有聲名。"
      }
    }
  },
  "巳時": {
    "range": "(上午九點起至上午十一點止)",
    "main_description": "巳時生人,手段精明智能非少,儘能積小成大,自成家業,六親無緣離祖成,雖至親密者亦多懼與接近,女人虛嘩,難得良緣,好飲酒癖。",
    "career": "聰明才智宜就文科、文化教育事業並商業職業,鐮業加工業事業。",
    "details": {
      "頭": {
        "description": "巳時頭生母先卒,兄弟難靠六親拙,早婚待慢蔭妻子,日後衣祿女益夫。",
        "poem": "田宅好光輝。文章應相隨,男命官位職,女人有權威。"
      },
      "中": {
        "description": "時中出世父母在,一生榮貴祿多財,兄弟子息家和順,爲師藝術主重栽。",
        "poem": "爲人多慷慨,好生得財來,公事有實力,出外好安排。"
      },
      "末": {
        "description": "時末出生父先埋,謀事有勝亦有敗,兄弟不睦六親散,早年多勞及奔波。",
        "poem": "千里路途遠,心急馬行難,遵守如積德,晚年各自安。"
      }
    }
  },
  "午時": {
    "range": "(上午十一點起至下午一點止)",
    "main_description": "午時生人,具有自高自大之心理,驕氣甚盛性急敏速,出人頭地眼高於頂,不守祖業心否外出,女人妖嬌緣在遠方,極端主義浪費不計。",
    "career": "喜歡政治、產科醫院、護士商科,明星技藝、航行運輸、流動工商業等。",
    "details": {
      "頭": {
        "description": "時頭生人雙親在,聰明伶俐貴人栽,六親兄弟自有靠,兒子三五衣祿皆。",
        "poem": "午時有能威,出入有人隨,一生多享應,出外得顯貴。"
      },
      "中": {
        "description": "時中出生先剋父,衣祿中平苦奔勞,中年過後暫見好,先難後益得安多。",
        "poem": "生來不貪求,衣祿待時遇,勞力遊四海,晚景度春秋。"
      },
      "末": {
        "description": "時末生人母先拾,聰明伶俐兼性急,兄弟難靠六親無,一生奔波到老好。",
        "poem": "妻兒父母憂,財帛不能留,前程步雲影,必定苦中求。"
      }
    }
  },
  "未時": {
    "range": "(下午一點起至下午三點止)",
    "main_description": "未時生人,一舉一動於謙讓之中,貌爲柔順内心則極堅強,父母難爲兄弟無靠中限驚恐,子女多智,合作經營等業多變易動,氣量不大心身難定。",
    "career": "宜習商科、流動性工商業、產科醫院及任護士、土木業、電氣木器等業。",
    "details": {
      "頭": {
        "description": "時頭生人雙親全,一生安樂六親歡,男智多謀女益夫,識重知輕人君子。",
        "poem": "出世得良時,威力自有餘,命中多益貴,晚年家團圓。"
      },
      "中": {
        "description": "時中出世父先亡,人和性寬祿衣藏,兄弟有情恐剋妻,親族無幫子息難。",
        "poem": "少年休鄉墜,衣祿自然隨,生計勞力持,文章有時貴。"
      },
      "末": {
        "description": "時末生人母先皈,有勝有敗必自揮,六親力劣衣祿自,手足反拙子幫扶。",
        "poem": "親祿應待時,立志得佳期,悲憂亦有喜,晚景豐財利。"
      }
    }
  },
  "申時": {
    "range": "(下午三點起至下午五點止)",
    "main_description": "申時生人,具有雙重性格,心理難得平衡,足以構成其社會地位,宜離祖業,父母無靠,夫妻和順,若女者恐破婚之應,心情事定,多能破敗。",
    "career": "聰明才智利於文化教育事業、金融界、銀樓、五金商、鐘錶料理等職。",
    "details": {
      "頭": {
        "description": "時頭出世父母全,聰明多藝貴人蟠,文武齊功智足俐,六親助力進田園。",
        "poem": "一生運限高,立業積富豪,子息多得力,福祿慶家和。"
      },
      "中": {
        "description": "時中生人先送父,六親疏遠奈身扶,有憂有喜從實吉,早婚傷刑多勞事。",
        "poem": "運逢有聲名,親疏弟無情,勞祿自成立,換新改門庭。"
      },
      "末": {
        "description": "時末生人母先亡,六親兄弟言費工,早年辛苦身多病,中年過後喜融融。",
        "poem": "衣祿得自興,環境暫移新,爲人好計較,晚年福不輕。"
      }
    }
  },
  "酉時": {
    "range": "(下午五點起至下午七點止)",
    "main_description": "酉時生人,沉默寧靜思深慮遠,心地善良忘實可靠,幼年多勞兄弟綠薄分開,遵父母言成語,乏子宜養,女人厚情,謹守機密,自尊心強,暴食好爭。",
    "career": "多才多藝宜於攻習文藝、畫家、政治教員、音樂、戲劇、金石、裝飾、加工事業。",
    "details": {
      "頭": {
        "description": "時頭生人父母雙全,文武精通貴官員,六親有靠兄弟離,財祿盛裕子虛難。",
        "poem": "宅舍得光輝,富貴一生隨,協力慇憼計,文武自然貴。"
      },
      "中": {
        "description": "時中生人父皈,兄弟不和離祖居,夫妻欠和子息遲,早年不比老運時。",
        "poem": "衣祿不爲虧,聲名自中隨,朝夕慚惶淚,恐走他人位。"
      },
      "末": {
        "description": "時末出世先送母,兄弟中劣衣祿勞,夫妻刑剋子息慢,女人淫亂宜守德。",
        "poem": "食住自安排,人情事可諧,爲人心性好,中運就發財。"
      }
    }
  },
  "戌時": {
    "range": "(下午七點起至下午九點止)",
    "main_description": "戌時生人,舉動靈敏精神勇敢,一經計劃就緒,全力實施擴展,富有膽力,獨行奮鬥,福祿有進,歡樂一生,女人虛榮,含有短氣,不忍耐性。",
    "career": "宜習有關理科之學術,作家詩人,化工機械,農林土木,五金米穀等職。",
    "details": {
      "頭": {
        "description": "時頭生人母先亡,性急慈悲心寬莊,兄弟無靠六親平,運逢財權有柄廣。",
        "poem": "慈心善道栽,發財入手來,且有自耕力,常得貴人抬。"
      },
      "中": {
        "description": "時中出生先父卒。兄弟幫助耐心沒,夫妻長息恐刑剋,四十餘來家成物。",
        "poem": "平心事勿藏,生來本有防,膽量如天大,開口急顯狂"
      },
      "末": {
        "description": "時尾生人雙親全,文武精巧性情急,六親兄弟皆有靠,手藝皆通夫婦和。",
        "poem": "衣祿自然安,平生福自寬,一生性焦急,晚年家團圓。"
      }
    }
  },
  "亥時": {
    "range": "(下午九點起至下午十一點止)",
    "main_description": "亥時生人,情感濃厚敏銳,倘能加意修養,意志強固,沉著待人按物熱心,手藝等徵,女人性剛強,易怒易解,衣祿勤勞,財帛大旺。",
    "career": "宜習經濟法律,外科醫學,學校藝術,五金公共機構,宗教慈善社會等事。",
    "details": {
      "頭": {
        "description": "時頭生人母先亡,性寬兄弟情疏遠,六親力劣初年苦,子息二三衣祿寬。",
        "poem": "命苦衷關,初年運未返,一待時臨到,白手成家園。"
      },
      "中": {
        "description": "時中出生父母全,爲人聰明性焦急,六親兄弟多和好,男威女權少難興。",
        "poem": "有事會謀旅,生來福自餘,心能依公道,衣祿更不虧。"
      },
      "末": {
        "description": "時末生人先送父,性燥心慈六親疏,兄弟難爲早年勞,男娶雙妻女剋夫。",
        "poem": "衣祿錦難量,男女帶刑傷,夫婦無良德,二姓子相當。"
      }
    }
  }
}   ;

    const boneWeightData = {
  "year": { // 數據來源：綜合常見版本，請務必核對！
    "甲子": 12, "乙丑": 9,  "丙寅": 6,  "丁卯": 7,  "戊辰": 12, "己巳": 5,
    "庚午": 9,  "辛未": 8,  "壬申": 7,  "癸酉": 8,  "甲戌": 15, "乙亥": 9,
    "丙子": 16, "丁丑": 8,  "戊寅": 8,  "己卯": 19, "庚辰": 12, "辛巳": 6,
    "壬午": 8,  "癸未": 7,  "甲申": 5,  "乙酉": 15, "丙戌": 6,  "丁亥": 16,
    "戊子": 15, "己丑": 7,  "庚寅": 9,  "辛卯": 12, "壬辰": 10, "癸巳": 7,
    "甲午": 15, "乙未": 6,  "丙申": 5,  "丁酉": 14, "戊戌": 14, "己亥": 9,
    "庚子": 7,  "辛丑": 7,  "壬寅": 9,  "癸卯": 12, "甲辰": 8,  "乙巳": 7,
    "丙午": 13, "丁未": 5,  "戊申": 14, "己酉": 5,  "庚戌": 9,  "辛亥": 17,
    "壬子": 5,  "癸丑": 7,  "甲寅": 12, "乙卯": 8,  "丙辰": 8,  "丁巳": 6,
    "戊午": 19, "己未": 6,  "庚申": 8,  "辛酉": 16, "壬戌": 10, "癸亥": 7
  },
  "month": { // 數據來源：綜合常見版本，請務必核對！
    "正月": 6,   "二月": 7,   "三月": 18,  "四月": 9,
    "五月": 5,   "六月": 16,  "七月": 9,   "八月": 15,
    "九月": 18,  "十月": 8,   "十一月": 9, "十二月": 5
  },
  "day": { // 數據來源：綜合常見版本，請務必核對！
    "初一日": 5,  "初二日": 10, "初三日": 8,  "初四日": 15, "初五日": 16,
    "初六日": 15, "初七日": 8,  "初八日": 16, "初九日": 8,  "初十日": 16,
    "十一日": 9,  "十二日": 17, "十三日": 8,  "十四日": 17, "十五日": 10,
    "十六日": 8,  "十七日": 9,  "十八日": 18, "十九日": 5,  "二十日": 15,
    "二十一日": 10,"二十二日": 9,  "二十三日": 8,  "二十四日": 9,  "二十五日": 15,
    "二十六日": 18,"二十七日": 7,  "二十八日": 8,  "二十九日": 16, "三十日": 6
  },
  "hour": { // 數據來源：綜合常見版本，請務必核對！
    "子時": 16,  "丑時": 6,   "寅時": 7,   "卯時": 10,
    "辰時": 9,   "巳時": 16,  "午時": 10,  "未時": 8,
    "申時": 8,   "酉時": 9,   "戌時": 6,   "亥時": 6
  }
}   ;

    const boneFortuneData = {
  "21": { // 二兩一錢
    "weightText": "二兩一錢",
    "poem": "此人衣食奔波出外之命也。\n短命非業謂大凶，平生災難事重重，\n凶禍頻臨陷逆境，終世困苦事不成。",
    "explanation": ""
  },
  "22": { // 二兩二錢
    "weightText": "二兩二錢",
    "poem": "此人幼年勞碌中年清泰之命也。\n身寒骨冷苦伶仃，此命推來行乞人，\n勞勞碌碌無度日，終年打拱過平生。",
    "explanation": ""
  },
  "23": { // 二兩三錢
    "weightText": "二兩三錢",
    "poem": "此人先難後易出外求人之命也。\n此命推來骨輕輕，求謀做事事難成，\n妻兒兄弟實難靠，外出他鄉做散人。",
    "explanation": ""
  },
  "24": { // 二兩四錢
    "weightText": "二兩四錢",
    "poem": "此人為人智巧多能出家求食之命也。\n此命推來福祿無，門庭困苦總難榮，\n六親骨肉皆無靠，流到他鄉作老翁。",
    "explanation": ""
  },
  "25": { // 二兩五錢
    "weightText": "二兩五錢",
    "poem": "此人身閑心不閑九流藝術之命心。\n此命推來祖業微，門庭營度甚艱辛，\n六親骨肉如冰炭，一世勤勞自立人。",
    "explanation": ""
  },
  "26": { // 二兩六錢
    "weightText": "二兩六錢",
    "poem": "此人先貧後富勞碌之命也。\n平生衣祿苦中求，獨自營謀事不休，\n離祖出門宜早計，晚來衣祿自無憂。",
    "explanation": ""
  },
  "27": { // 二兩七錢
    "weightText": "二兩七錢",
    "poem": "此人聰明近貴衣祿之命也。\n一生做事少商量，難靠祖宗作主張，\n獨馬單槍空做去，早年晚歲總無長。",
    "explanation": ""
  },
  "28": { // 二兩八錢
    "weightText": "二兩八錢",
    "poem": "此人自桌為人才能近貴之命也。\n一生做事似飄蓬，祖宗產業在夢中，\n若不過房併改姓，也當移徒二三通。",
    "explanation": ""
  },
  "29": { // 二兩九錢
    "weightText": "二兩九錢",
    "poem": "此人才能客商達變智慧之命也。\n初年運限未曾亨，縱有功名在後成，\n須過四旬方可立，移居改姓始為良。",
    "explanation": ""
  },
  "30": { // 三兩
    "weightText": "三兩",
    "poem": "此人衣食有餘為人近貴成定之命也。\n勞勞碌碌苦中求，東奔西走何日休，\n若使終身勤與儉，老來稍可免憂愁。",
    "explanation": ""
  },
  "31": { // 三兩一錢
    "weightText": "三兩一錢",
    "poem": "此人先貧後富近貴衣食足用之命也。\n忙忙碌碌苦中求，何日雲開見日頭，\n難得祖基家可立，中年衣食漸無憂。",
    "explanation": ""
  },
  "32": { // 三兩二錢
    "weightText": "三兩二錢",
    "poem": "此人性巧過人衣食到老近貴之命也。\n初年運蹇事難謀，漸有財源如水流，\n到得中年衣食旺，那時名利一齊收。",
    "explanation": ""
  },
  "33": { // 三兩三錢
    "weightText": "三兩三錢",
    "poem": "此人衣食豐滿富貴根基之命也。\n早年做事事難成，百計徒勞枉費心，\n半世自如流水去，後來運到始得金。",
    "explanation": ""
  },
  "34": { // 三兩四錢
    "weightText": "三兩四錢",
    "poem": "此人財穀有餘主得內助富貴之命也。\n此命福氣果如何，僧道門中衣祿多，\n離祖出家方可好，終朝拜佛念彌陀。",
    "explanation": ""
  },
  "35": { // 三兩五錢
    "weightText": "三兩五錢",
    "poem": "此人先難後易過房入贅近貴之命也。\n生平福量不周全，祖業根基覺少傳，\n營事生涯宜守舊，時來衣食勝從前。",
    "explanation": ""
  },
  "36": { // 三兩六錢
    "weightText": "三兩六錢",
    "poem": "此人超群拔類衣祿厚重之命也。\n不須勞碌過平生，獨自成家福不輕，\n早有福星常照命，任君行去百般成。",
    "explanation": ""
  },
  "37": { // 三兩七錢
    "weightText": "三兩七錢",
    "poem": "此人聰明富貴有福壽之命也。\n此命般般事不成，弟兄少力自孤成，\n雖然祖業須微有，來得明時去得時。",
    "explanation": ""
  },
  "38": { // 三兩八錢
    "weightText": "三兩八錢",
    "poem": "此人財帛豐厚宜稱之命也。\n一生骨肉最清高，早入簧門姓氏標，\n待到年將三十六，藍衫脫去換紅袍。",
    "explanation": ""
  },
  "39": { // 三兩九錢
    "weightText": "三兩九錢",
    "poem": "此人利上近貴有福有祿之命也。\n此命少年運不通，勞心做事盡皆空，\n苦心竭力成家計，到得那時在夢中。",
    "explanation": ""
  },
  "40": { // 四兩
    "weightText": "四兩",
    "poem": "此人富貴近益生涯鼎盛機關之命也。\n平生衣祿是綿長，件件心中自主張，\n前面風霜多受過，後來必定享安康。",
    "explanation": ""
  },
  "41": { // 四兩一錢
    "weightText": "四兩一錢",
    "poem": "此人稅戶近貴專才衣祿之命也。\n此命推來事不同，為人能幹異凡庸，\n中年還有逍遙福，不比前時運未通。",
    "explanation": ""
  },
  "42": { // 四兩二錢
    "weightText": "四兩二錢",
    "poem": "此人兵權有職富貴才能之命也。\n得寬懷處且寬懷，何用雙眉皺不開，\n若使中年命運濟，那時名利一齊來。",
    "explanation": ""
  },
  "43": { // 四兩三錢
    "weightText": "四兩三錢",
    "poem": "此人財祿厚重白手成家之命也。\n為人心性最聰明，作事軒昂近貴人，\n衣祿一生天數定，不須勞碌過平生。",
    "explanation": ""
  },
  "44": { // 四兩四錢
    "weightText": "四兩四錢",
    "poem": "此人才能好學近貴財祿之命也。\n萬事由天莫強求，須知福祿勝前途，\n當年財帛難如意，晚景欣然便不憂。",
    "explanation": ""
  },
  "45": { // 四兩五錢
    "weightText": "四兩五錢",
    "poem": "此人福祿豐厚極富且貴之命也。\n富中取貴格求真，明敏才華志自伸，\n福祿壽全家道吉，桂蘭毓秀晚榮臻。",
    "explanation": ""
  },
  "46": { // 四兩六錢
    "weightText": "四兩六錢",
    "poem": "此人富貴有餘福壽雙全之命也。\n東西南北盡皆通，出姓移居更覺隆，\n衣祿無虧天數定，中年晚景一般同。",
    "explanation": ""
  },
  "47": { // 四兩七錢
    "weightText": "四兩七錢",
    "poem": "此人高官厚祿學業飽滿之命也。\n此命推來旺末年，妻榮子貴自怡然，\n平生原有滔滔福，財源滾滾似水流。",
    "explanation": ""
  },
  "48": { // 四兩八錢
    "weightText": "四兩八錢",
    "poem": "此人官員財祿厚重之命也。\n初年運道未曾亨，若是蹉跎再不興，\n兄弟六親皆無靠，一身事業晚年成。",
    "explanation": ""
  },
  "49": { // 四兩九錢
    "weightText": "四兩九錢",
    "poem": "此人性巧精神倉庫財祿之命也。\n此命推來福不輕，自成自立顯門庭，\n從來富貴人親近，使婢差奴過一生。",
    "explanation": ""
  },
  "50": { // 五兩
    "weightText": "五兩",
    "poem": "此人文武才能錢穀豐盛之命也。\n為名為利終日勞，中年福祿也多遭，\n老來是有財星照，不比前番目下高。",
    "explanation": ""
  },
  "51": { // 五兩一錢
    "weightText": "五兩一錢",
    "poem": "此人官職財祿榮華富貴之命也。\n一世榮華事事通，不須勞碌自亨通，\n弟兄叔侄皆如意，家業成時福祿宏。",
    "explanation": ""
  },
  "52": { // 五兩二錢
    "weightText": "五兩二錢",
    "poem": "此人掌握兵權富貴長壽之命也。\n一世亨通事事能，不須勞思自然能，\n宗施欣然心皆好，家產豐盈自稱心。",
    "explanation": ""
  },
  "53": { // 五兩三錢
    "weightText": "五兩三錢",
    "poem": "此人僧道門中近貴之命也。\n此格推來氣象真，興家發達在其中，\n一生福祿安排定，卻是人間一富翁。",
    "explanation": ""
  },
  "54": { // 五兩四錢
    "weightText": "五兩四錢",
    "poem": "此人有威權富貴財祿之命也。\n此命推來厚且清，詩書滿腹看功成，\n豐衣足食自然穩，正是人間有福人。",
    "explanation": ""
  },
  "55": { // 五兩五錢
    "weightText": "五兩五錢",
    "poem": "此人官職財祿豐盛之命也。\n策馬揚鞭爭名利，少年作事費籌論，\n一朝福祿源源至，富貴榮華顯六親。",
    "explanation": ""
  },
  "56": { // 五兩六錢
    "weightText": "五兩六錢",
    "poem": "此人官職長享榮華富貴之命也。\n此格推來禮義通，終身福祿用無窮，\n甜酸苦辣皆嘗過，滾滾財源穩且豐。",
    "explanation": ""
  },
  "57": { // 五兩七錢
    "weightText": "五兩七錢",
    "poem": "此人官職文章壓眾精通之命也。\n福祿盈盈萬事全，一生榮耀顯雙親，\n名揚威震人欽敬，處事逍遙似遇春。", // 此處詩句可能因版本而異
    "explanation": ""
  },
  "58": { // 五兩八錢
    "weightText": "五兩八錢",
    "poem": "此人官職旺像才能性質富貴之命也。\n平生福祿自然來，名利雙全福祿偕，\n雁塔題名為貴客，紫袍金帶走金偕。",
    "explanation": ""
  },
  "59": { // 五兩九錢
    "weightText": "五兩九錢",
    "poem": "此人官職財祿厚重之命也。\n細推此格妙且清，必定才高禮義通，\n甲第之中應有分，揚鞭走馬顯威榮。",
    "explanation": ""
  },
  "60": { // 六兩
    "weightText": "六兩",
    "poem": "此人官職榮華福壽財祿之命也。\n一朝金榜快題名，顯祖榮宗立大功，\n衣食定然原裕足，田園財帛更豐盈。",
    "explanation": ""
  },
  "61": { // 六兩一錢
    "weightText": "六兩一錢",
    "poem": "此人法身官掌風雷權柄之命也。\n不做朝中金榜客，定為世上一財翁，\n聰明天賦經書熟，名顯高科自是榮。",
    "explanation": ""
  },
  "62": { // 六兩二錢
    "weightText": "六兩二錢",
    "poem": "此人官職有權柄之命也。\n此命生來福不窮，讀書必定顯親宗，\n紫衣金帶為卿相，富貴榮華皆可同。",
    "explanation": ""
  },
  "63": { // 六兩三錢
    "weightText": "六兩三錢",
    "poem": "此人指揮太守萬戶封侯之命也。\n命主為官福祿長，得來富貴定非常，\n名題金塔傳金榜，定中高科天下揚。",
    "explanation": ""
  },
  "64": { // 六兩四錢
    "weightText": "六兩四錢",
    "poem": "此人官職尚書侍郎之命也。\n此格威權不可當，紫袍金帶坐高堂，\n榮華富貴誰能及，積玉堆金滿儲倉。",
    "explanation": ""
  },
  "65": { // 六兩五錢
    "weightText": "六兩五錢",
    "poem": "此人威權發無邊財福祿之命也。\n細推此命福不輕，定國安邦極品人，\n文綉雕梁徵富貴，威聲照耀四方聞。",
    "explanation": ""
  },
  "66": { // 六兩六錢
    "weightText": "六兩六錢",
    "poem": "此人公侯駙馬丞相之命也。\n此格人間一福人，堆金積玉滿堂春，\n從來富貴由天定，天笏垂紳謁聖君。",
    "explanation": ""
  },
  "67": { // 六兩七錢
    "weightText": "六兩七錢",
    "poem": "此人冠世萬國來朝上格之命也。\n此命生來福自宏，田園家業最高隆，\n平生衣祿豐盈足，一世榮華萬事通。",
    "explanation": ""
  },
  "68": { // 六兩八錢
    "weightText": "六兩八錢",
    "poem": "此人溫和幸福富貴極吉之命也。\n富貴由天莫苦求，萬金家計不須謀，\n十年不比前番事，祖業根基水上舟。", // 此處詩句可能與其他版本有差異
    "explanation": ""
  },
  "69": { // 六兩九錢
    "weightText": "六兩九錢",
    "poem": "此人惠受高位功名顯達之命也。\n君是人間衣祿星，一生富貴眾人欽，\n縱然福祿由天定，安享榮華過一生。",
    "explanation": ""
  },
  "70": { // 七兩
    "weightText": "七兩",
    "poem": "此人權力俱備志望上流之命也。\n此命推來福不輕，何須愁慮苦勞心，\n一生天定衣與祿，富貴榮華過一生。",
    "explanation": ""
  },
  "71": { // 七兩一錢
    "weightText": "七兩一錢",
    "poem": "此人大志大業勢如破竹之命也。\n此命生成大不同，公侯卿相在其中，\n一生自有逍遙福，富貴榮華極品隆。",
    "explanation": ""
  },
  "72": { // 七兩二錢 (部分版本有此，為極品之命)
    "weightText": "七兩二錢",
    "poem": "此人罕有生帝王之命也。\n此格世界罕有生，十代積善產此人，\n天上紫微星照命，統治萬民樂太平。",
    "explanation": ""
  }
  // 您可以根據您的資料來源，決定是否包含七兩二錢，或是否有其他骨重。
}   ;


    // --- 輔助函式：格式化骨重顯示 ---
    function formatWeight(qianValue) {
        if (qianValue === undefined || qianValue === null || isNaN(qianValue) || qianValue < 0) {
            return "未知"; // 或返回空字串，根據您的偏好
        }
        const liang = Math.floor(qianValue / 10);
        const qian = qianValue % 10;
        let result = "";
        if (liang > 0) {
            result += liang + "兩";
        }
        if (qian > 0 || liang === 0) { // 如果只有錢或者兩和錢都有，才顯示錢
            result += qian + "錢";
        }
        return result || "零錢"; // 避免結果為空 (例如骨重剛好是0錢)
    }

    // --- 視圖切換函式 ---
    function showMainQueryView() {
        if (mainQueryAndControlsSection) mainQueryAndControlsSection.classList.remove('hidden');
        if (mainQueryControls) mainQueryControls.classList.remove('hidden');
        if (fullViewControlsSection) fullViewControlsSection.classList.remove('hidden');
        if (resultSectionDiv) resultSectionDiv.classList.add('hidden');
        if (resultOutputDiv) resultOutputDiv.innerHTML = '';
        if (fullDataViewSection) fullDataViewSection.classList.add('hidden');
        window.scrollTo(0, 0);
    }

    function showFullDataView(title) {
        if (mainQueryAndControlsSection) mainQueryAndControlsSection.classList.add('hidden');
        if (resultSectionDiv) resultSectionDiv.classList.add('hidden');
        if (fullDataViewSection) fullDataViewSection.classList.remove('hidden');
        if (fullDataViewTitle) fullDataViewTitle.textContent = title;
        if (fullDataViewOutput) fullDataViewOutput.innerHTML = '';
        window.scrollTo(0, 0);
    }
    
    // --- 2. Populate Initial Selectors ---
    function populateInitialSelectors() {
        // Populate Shengxiao for Year
        if (yearData && yearData.length > 0) {
            const shengxiaos = [...new Set(yearData.map(item => item.shengxiao))];
            shengxiaos.sort((a, b) => {
                const order = ["鼠", "牛", "虎", "兔", "龍", "蛇", "馬", "羊", "猴", "雞", "狗", "豬"];
                return order.indexOf(a) - order.indexOf(b);
            });
            shengxiaoSelect.innerHTML = '<option value="">--選擇生肖--</option>';
            shengxiaos.forEach(sx => {
                const option = document.createElement('option');
                option.value = sx;
                option.textContent = sx;
                shengxiaoSelect.appendChild(option);
            });
        }

        // Populate Months
        if (monthData && Object.keys(monthData).length > 0) {
            monthSelect.innerHTML = '<option value="">--選擇月份--</option>';
            const monthOrder = ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
            monthOrder.forEach(monthKey => {
                if (monthData[monthKey]) {
                    const option = document.createElement('option');
                    option.value = monthKey;
                    option.textContent = monthKey;
                    monthSelect.appendChild(option);
                }
            });
        }

        // Populate Days
        if (dayData && dayData.length > 0) {
            daySelect.innerHTML = '<option value="">--選擇日期--</option>';
            dayData.forEach(day => {
                const option = document.createElement('option');
                option.value = day.date;
                option.textContent = day.date;
                daySelect.appendChild(option);
            });
        }

        // Populate Main Hours
        if (hourData && Object.keys(hourData).length > 0) {
            hourMainSelect.innerHTML = '<option value="">--選擇時辰--</option>';
            const hourOrder = ["子時", "丑時", "寅時", "卯時", "辰時", "巳時", "午時", "未時", "申時", "酉時", "戌時", "亥時"];
            hourOrder.forEach(hourKey => {
                if (hourData[hourKey]) {
                    const option = document.createElement('option');
                    option.value = hourKey;
                    option.textContent = hourKey;
                    hourMainSelect.appendChild(option);
                }
            });
        }
    }

    // --- 3. Event Listeners ---
    if (shengxiaoSelect) {
        shengxiaoSelect.addEventListener('change', function() {
            ganzhiSelect.innerHTML = '<option value="">--請先選生肖--</option>';
            if (this.value === "") {
                ganzhiSelect.disabled = true;
                ganzhiSelect.value = ""; // 清空天干地支選擇
                return;
            }
            const selectedShengxiao = this.value;
            const filteredGanzhi = yearData.filter(item => item.shengxiao === selectedShengxiao);

            if (filteredGanzhi.length > 0) {
                ganzhiSelect.innerHTML = '<option value="">--選擇天干地支(若要查詢生肖為必選)--</option>';
                 filteredGanzhi.forEach(gz => {
                    const option = document.createElement('option');
                    option.value = gz.ganzhi;
                    option.textContent = gz.ganzhi;
                    ganzhiSelect.appendChild(option);
                });
                ganzhiSelect.disabled = false;
            } else {
                ganzhiSelect.disabled = true;
            }
            ganzhiSelect.value = ""; // 清空天干地支選擇，讓使用者必須選
        });
    }

    if (hourMainSelect) {
        hourMainSelect.addEventListener('change', function() {
            hourDetailSelect.disabled = (this.value === "");
            hourDetailSelect.value = "main";
        });
    }

    // --- 4. Query Button Logic (for main query) ---
    if (queryButton) {
        queryButton.addEventListener('click', function() {
            resultOutputDiv.innerHTML = '';
            let resultsHtml = '';
            let hasResults = false;

            const selectedGanzhi = ganzhiSelect.value;
            const selectedMonth = monthSelect.value;
            const selectedDay = daySelect.value;
            const selectedHour = hourMainSelect.value;
            const selectedDetail = hourDetailSelect.value;

            let yearW = null, monthW = null, dayW = null, hourW = null;

            if (selectedGanzhi && boneWeightData && boneWeightData.year && boneWeightData.year[selectedGanzhi] !== undefined) {
                yearW = boneWeightData.year[selectedGanzhi];
            }
            if (selectedMonth && boneWeightData && boneWeightData.month && boneWeightData.month[selectedMonth] !== undefined) {
                monthW = boneWeightData.month[selectedMonth];
            }
            if (selectedDay && boneWeightData && boneWeightData.day && boneWeightData.day[selectedDay] !== undefined) {
                dayW = boneWeightData.day[selectedDay];
            }
            if (selectedHour && boneWeightData && boneWeightData.hour && boneWeightData.hour[selectedHour] !== undefined) {
                hourW = boneWeightData.hour[selectedHour];
            }

            if (selectedGanzhi) {
                const yearResult = yearData.find(item => item.ganzhi === selectedGanzhi);
                if (yearResult) {
                    resultsHtml += `<div class="result-block">`;
                    resultsHtml += displayYearResult(yearResult, true, yearW);
                    resultsHtml += `</div>`;
                    hasResults = true;
                }
            }
            if (selectedMonth) {
                const monthResult = monthData[selectedMonth];
                if (monthResult) {
                    resultsHtml += `<div class="result-block">`;
                    resultsHtml += displayMonthResult(selectedMonth, monthResult, true, monthW);
                    resultsHtml += `</div>`;
                    hasResults = true;
                }
            }
            if (selectedDay) {
                const dayResult = dayData.find(item => item.date === selectedDay);
                if (dayResult) {
                    resultsHtml += `<div class="result-block">`;
                    resultsHtml += displayDayResult(dayResult, true, dayW);
                    resultsHtml += `</div>`;
                    hasResults = true;
                }
            }
            if (selectedHour) {
                const hourResult = hourData[selectedHour];
                if (hourResult) {
                    resultsHtml += `<div class="result-block">`;
                    resultsHtml += displayHourResult(selectedHour, hourResult, selectedDetail, true, hourW);
                    resultsHtml += `</div>`;
                    hasResults = true;
                }
            }

            if (hasResults) {
                if (selectedGanzhi && selectedMonth && selectedDay && selectedHour &&
                    yearW !== null && monthW !== null && dayW !== null && hourW !== null) { // 確保所有骨重都有效
                    const boneFortuneHtml = calculateAndDisplayBoneWeightFortune(
                        selectedGanzhi, yearW,
                        selectedMonth, monthW,
                        selectedDay, dayW,
                        selectedHour, hourW
                    );
                    if (boneFortuneHtml) {
                        resultsHtml += boneFortuneHtml;
                    }
                }
                resultOutputDiv.innerHTML = resultsHtml;
                resultSectionDiv.classList.remove('hidden');
            } else {
                resultOutputDiv.innerHTML = "<p>請至少選擇一個有效的查詢條件，或查無資料。</p>";
                resultSectionDiv.classList.remove('hidden');
            }
        });
    }

    // --- Reset Button Logic ---
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            shengxiaoSelect.value = "";
            ganzhiSelect.innerHTML = '<option value="">--請先選生肖--</option>';
            ganzhiSelect.disabled = true;
            monthSelect.value = "";
            daySelect.value = "";
            hourMainSelect.value = "";
            hourDetailSelect.value = "main";
            hourDetailSelect.disabled = true;
            resultOutputDiv.innerHTML = "";
            resultSectionDiv.classList.add('hidden');
        });
    }

    // --- 5. Display Functions ---
    function displayYearResult(data, returnHtml = false, yearQian = null) {
        let html = `<h3>${data.ganzhi}年生 (肖${data.shengxiao}，五行屬${data.wuxing})</h3>`;
        if (yearQian !== null && boneWeightData.year[data.ganzhi] !== undefined) {
            html += `<p class="item-bone-weight"><strong>本年骨重：</strong> ${formatWeight(yearQian)}</p>`;
        }
        html += `<p>${data.description.replace(/\n/g, '<br>')}</p>`;
        if (returnHtml) return html;
        // resultOutputDiv.innerHTML = html; // Not needed if always called with returnHtml
    }

    function displayMonthResult(monthName, data, returnHtml = false, monthQian = null) {
        let html = `<h3>${monthName}生人</h3>`;
        if (monthQian !== null && boneWeightData.month[monthName] !== undefined) {
            html += `<p class="item-bone-weight"><strong>本月骨重：</strong> ${formatWeight(monthQian)}</p>`;
        }
        if (data.description) {
            html += `<p>${data.description.replace(/\n/g, '<br>')}</p>`;
        }
        if (data.poem && data.poem.trim() !== "") {
            html += `<h4>詩曰：</h4><p class="poem">${data.poem.replace(/\n/g, '<br>')}</p>`;
        }
        if (returnHtml) return html;
        // resultOutputDiv.innerHTML = html;
    }

    function displayDayResult(data, returnHtml = false, dayQian = null) {
        let html = `<h3>${data.date}生</h3>`;
        if (dayQian !== null && boneWeightData.day[data.date] !== undefined) {
            html += `<p class="item-bone-weight"><strong>本日骨重：</strong> ${formatWeight(dayQian)}</p>`;
        }
        html += `<p>${data.description.replace(/\n/g, '<br>')}</p>`;
        if (returnHtml) return html;
        // resultOutputDiv.innerHTML = html;
    }

    function displayHourResult(hourName, data, detailKey, returnHtml = false, hourQian = null) {
        let html = `<h3>${hourName} <span class="range">${data.range || ''}</span></h3>`;
        if (hourQian !== null && boneWeightData.hour[hourName] !== undefined) {
            html += `<p class="item-bone-weight"><strong>本時辰骨重：</strong> ${formatWeight(hourQian)}</p>`;
        }
        let mainContentHtml = '';
        let detailContentHtml = '';
        let mainContentAdded = false;

        if (data.main_description && data.main_description.trim() !== "") {
            mainContentHtml += `<h4>主要描述：</h4><p>${data.main_description.replace(/\n/g, '<br>')}</p>`;
            mainContentAdded = true;
        }
        if (data.career && data.career.trim() !== "") {
            mainContentHtml += `<h4>事業方面：</h4><p class="career">${data.career.replace(/\n/g, '<br>')}</p>`;
            mainContentAdded = true;
        }

        if (detailKey !== "main") {
            const detailData = data.details ? data.details[detailKey] : null;
            let subTitle = "";
            if (detailKey === "頭") subTitle = "時頭生";
            else if (detailKey === "中") subTitle = "時中生";
            else if (detailKey === "末") subTitle = "時末生";

            detailContentHtml += `<hr class="divider">`;
            detailContentHtml += `<h4>${subTitle} (細分)：</h4>`;

            if (detailData && ((detailData.description && detailData.description.trim() !== "") || (detailData.poem && detailData.poem.trim() !== ""))) {
                if (detailData.description && detailData.description.trim() !== "") {
                    detailContentHtml += `<p>${detailData.description.replace(/\n/g, '<br>')}</p>`;
                }
                if (detailData.poem && detailData.poem.trim() !== "") {
                    detailContentHtml += `<h5>又曰：</h5><p class="poem">${detailData.poem.replace(/\n/g, '<br>')}</p>`;
                }
            } else {
                detailContentHtml += `<p>此時辰的 (${subTitle}) 細節資料暫缺。</p>`;
            }
        } else {
            if (!mainContentAdded) {
                mainContentHtml += "<p>此時辰主要描述或事業方面資料暫缺。</p>";
            }
        }
        html += mainContentHtml + detailContentHtml;
        if (returnHtml) return html;
        // resultOutputDiv.innerHTML = html;
    }

    // --- 6. Bone Weight Fortune Calculation and Display ---
    function calculateAndDisplayBoneWeightFortune(ganzhi, yearQian, month, monthQian, day, dayQian, hour, hourQian) {
        let totalQian = 0;
        let calculationDetails = '';
        let allWeightsValid = true;

        // 直接使用傳入的錢數
        if (yearQian !== undefined && yearQian !== null) {
            calculationDetails += `<p><strong>年份 (${ganzhi})：</strong> ${formatWeight(yearQian)}</p>`;
            totalQian += yearQian;
        } else { allWeightsValid = false; calculationDetails += `<p><strong>年份 (${ganzhi})：</strong> 骨重資料缺失</p>`; }

        if (monthQian !== undefined && monthQian !== null) {
            calculationDetails += `<p><strong>月份 (${month})：</strong> ${formatWeight(monthQian)}</p>`;
            totalQian += monthQian;
        } else { allWeightsValid = false; calculationDetails += `<p><strong>月份 (${month})：</strong> 骨重資料缺失</p>`; }
        
        if (dayQian !== undefined && dayQian !== null) {
            calculationDetails += `<p><strong>日期 (${day})：</strong> ${formatWeight(dayQian)}</p>`;
            totalQian += dayQian;
        } else { allWeightsValid = false; calculationDetails += `<p><strong>日期 (${day})：</strong> 骨重資料缺失</p>`; }

        if (hourQian !== undefined && hourQian !== null) {
            calculationDetails += `<p><strong>時辰 (${hour})：</strong> ${formatWeight(hourQian)}</p>`;
            totalQian += hourQian;
        } else { allWeightsValid = false; calculationDetails += `<p><strong>時辰 (${hour})：</strong> 骨重資料缺失</p>`; }


        let html = `<div class="bone-weight-result-block">`;
        html += `<h3>袁天罡稱骨命評</h3>`;
        html += `<div class="bone-weight-details">${calculationDetails}</div>`;

        if (!allWeightsValid) {
            html += `<p class="bone-weight-total"><strong>總骨重：</strong> 無法計算 (部分骨重資料缺失)</p>`;
            html += `</div>`; // Close bone-weight-result-block
            return html;
        }
        
        const totalWeightText = formatWeight(totalQian);
        html += `<p class="bone-weight-total"><strong>總骨重：</strong> ${totalWeightText}</p>`;

        const fortune = boneFortuneData ? boneFortuneData[totalQian.toString()] : null;

        if (fortune) {
            if (fortune.poem && fortune.poem.trim() !== "") { // 檢查詩詞是否為空
                 // 使用 fortune.weightText (如果存在) 或剛計算的 totalWeightText 作為詩句前的標題
                const poemTitle = fortune.weightText || totalWeightText;
                html += `<h4>命評詩曰 (${poemTitle})：</h4><p class="bone-fortune-poem">${fortune.poem.replace(/\n/g, '<br>')}</p>`;
            }
            if (fortune.explanation && fortune.explanation.trim() !== "") {
                html += `<h4>命評詳解：</h4><p class="bone-fortune-explanation">${fortune.explanation.replace(/\n/g, '<br>')}</p>`;
            }
        } else {
            html += `<p>此總骨重 (${totalWeightText}) 的命評資料暫缺。</p>`;
        }
        html += `</div>`; // Close bone-weight-result-block
        return html;
    }


    // --- 7. Functions and Event Listeners for "View All" feature ---
    if (document.getElementById('viewAllYearBtn')) {
        document.getElementById('viewAllYearBtn').addEventListener('click', () => displayAllData('year'));
    }
    if (document.getElementById('viewAllMonthBtn')) {
        document.getElementById('viewAllMonthBtn').addEventListener('click', () => displayAllData('month'));
    }
    if (document.getElementById('viewAllDayBtn')) {
        document.getElementById('viewAllDayBtn').addEventListener('click', () => displayAllData('day'));
    }
    if (document.getElementById('viewAllHourBtn')) {
        document.getElementById('viewAllHourBtn').addEventListener('click', () => displayAllData('hour'));
    }
    if (document.getElementById('viewAllBoneFortuneBtn')) {
        document.getElementById('viewAllBoneFortuneBtn').addEventListener('click', displayAllBoneFortunes);
    }
    if (backToMainQueryBtn) {
        backToMainQueryBtn.addEventListener('click', showMainQueryView);
    }

    function displayAllData(type) {
        let html = '';
        let title = '';
        const itemContainerStart = '<div class="data-item-block">';
        const itemContainerEnd = '</div>';

        switch (type) {
            // ... (case 'year', 'month', 'day' 保持不變) ...
            case 'year':
                title = "全部「年」資料 (含骨重)";
                if (yearData && yearData.length > 0 && boneWeightData && boneWeightData.year) {
                    yearData.forEach(item => {
                        html += itemContainerStart;
                        const yearW = boneWeightData.year[item.ganzhi];
                        html += displayYearResult(item, true, yearW);
                        html += itemContainerEnd;
                    });
                } else { html = "<p>「年」資料或其骨重資料未載入/為空。</p>"; }
                break;
            case 'month':
                title = "全部「月」資料 (含骨重)";
                if (monthData && Object.keys(monthData).length > 0 && boneWeightData && boneWeightData.month) {
                    const monthOrder = ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
                    monthOrder.forEach(monthKey => {
                        if (monthData[monthKey]) {
                            html += itemContainerStart;
                            const monthW = boneWeightData.month[monthKey];
                            html += displayMonthResult(monthKey, monthData[monthKey], true, monthW);
                            html += itemContainerEnd;
                        }
                    });
                } else { html = "<p>「月」資料或其骨重資料未載入/為空。</p>"; }
                break;
            case 'day':
                title = "全部「日」資料 (含骨重)";
                if (dayData && dayData.length > 0 && boneWeightData && boneWeightData.day) {
                    dayData.forEach(item => {
                        html += itemContainerStart;
                        const dayW = boneWeightData.day[item.date];
                        html += displayDayResult(item, true, dayW);
                        html += itemContainerEnd;
                    });
                } else { html = "<p>「日」資料或其骨重資料未載入/為空。</p>"; }
                break;

            case 'hour':
                title = "全部「時辰」資料 (含骨重及細節)"; // 修改標題以反映內容變化
                if (hourData && Object.keys(hourData).length > 0 && boneWeightData && boneWeightData.hour) {
                    const hourOrder = ["子時", "丑時", "寅時", "卯時", "辰時", "巳時", "午時", "未時", "申時", "酉時", "戌時", "亥時"];
                    hourOrder.forEach(hourKey => {
                        if (hourData[hourKey]) {
                            const item = hourData[hourKey];
                            const hourW = boneWeightData.hour[hourKey];
                            
                            html += itemContainerStart;
                            html += `<h3>${hourKey} <span class="range">${item.range || ''}</span></h3>`;

                            // 顯示單項骨重
                            if (hourW !== null && boneWeightData.hour[hourKey] !== undefined) {
                                html += `<p class="item-bone-weight"><strong>本時辰骨重：</strong> ${formatWeight(hourW)}</p>`;
                            }

                            // 顯示主要描述
                            if (item.main_description && item.main_description.trim() !== "") {
                                html += `<h4>主要描述：</h4><p>${item.main_description.replace(/\n/g, '<br>')}</p>`;
                            }
                            // 顯示事業方面
                            if (item.career && item.career.trim() !== "") {
                                html += `<h4>事業方面：</h4><p class="career">${item.career.replace(/\n/g, '<br>')}</p>`;
                            }

                            // 顯示頭、中、末細節
                            if (item.details) {
                                ["頭", "中", "末"].forEach(detailKey => {
                                    const detailData = item.details[detailKey];
                                    if (detailData && ((detailData.description && detailData.description.trim() !== "") || (detailData.poem && detailData.poem.trim() !== ""))) {
                                        let subTitle = "";
                                        if (detailKey === "頭") subTitle = "時頭生";
                                        else if (detailKey === "中") subTitle = "時中生";
                                        else if (detailKey === "末") subTitle = "時末生";
                                        
                                        html += `<hr class="divider" style="margin-top:10px; margin-bottom:10px;">`;
                                        html += `<h5>${subTitle} (細分)：</h5>`; // 使用 h5
                                        if (detailData.description && detailData.description.trim() !== "") {
                                            html += `<p>${detailData.description.replace(/\n/g, '<br>')}</p>`;
                                        }
                                        if (detailData.poem && detailData.poem.trim() !== "") {
                                            // 在 script.js 的 displayAllData 函式中，h6 的 style 屬性是直接寫在 HTML 標籤內的
                                            html += `<h6 style="font-weight:normal; font-style:italic; margin-top:5px; margin-bottom:3px;">又曰：</h6><p class="poem">${detailData.poem.replace(/\n/g, '<br>')}</p>`;
                                        }
                                    }
                                });
                            }
                            html += itemContainerEnd;
                        }
                    });
                } else { html = "<p>「時辰」資料或其骨重資料未載入/為空。</p>"; }
                break;
            default:
                html = "<p>未知的資料類型。</p>";
        }
        showFullDataView(title);
        if (fullDataViewOutput) fullDataViewOutput.innerHTML = html;
    }
function displayAllBoneFortunes() {
    let html = '';
    const title = "全部「袁天罡稱骨命評」總覽";
    const itemContainerStart = '<div class="data-item-block">'; // 可以復用現有樣式
    const itemContainerEnd = '</div>';

    if (boneFortuneData && Object.keys(boneFortuneData).length > 0) {
        // 為了按骨重排序顯示，我們先獲取所有鍵並排序
        // 鍵是字串形式的錢數，例如 "21", "22", ..., "72"
        const sortedWeights = Object.keys(boneFortuneData).sort((a, b) => parseInt(a) - parseInt(b));

        sortedWeights.forEach(weightKey => {
            const fortune = boneFortuneData[weightKey];
            if (fortune) {
                html += itemContainerStart;
                // 顯示總骨重 (例如：二兩一錢)
                html += `<h3>${fortune.weightText || formatWeight(parseInt(weightKey))}</h3>`;

                // 顯示命評詩句
                if (fortune.poem && fortune.poem.trim() !== "") {
                    // 詩句前的 "XXX之命" 斷語應該已經包含在 fortune.poem 的開頭了
                    html += `<h4>命評詩曰：</h4><p class="bone-fortune-poem">${fortune.poem.replace(/\n/g, '<br>')}</p>`;
                }
                // 顯示命評詳解
                if (fortune.explanation && fortune.explanation.trim() !== "") {
                    html += `<h4>命評詳解：</h4><p class="bone-fortune-explanation">${fortune.explanation.replace(/\n/g, '<br>')}</p>`;
                }
                html += itemContainerEnd;
            }
        });
    } else {
        html = "<p>「稱骨命評」資料未載入或為空。</p>";
    }

    showFullDataView(title); // 使用現有的函式切換視圖並設定標題
    if (fullDataViewOutput) fullDataViewOutput.innerHTML = html; // 將生成的 HTML 放入顯示區
}
    // --- Initial setup ---
    populateInitialSelectors();
    showMainQueryView(); // 預設顯示主查詢介面

});
