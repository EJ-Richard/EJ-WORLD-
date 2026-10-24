// 慈濟四大志業島・內容
// 敘述依慈濟基金會、年度報告書、大愛、人醫會與骨髓中心等公開頁整理。
// 數字只保留該頁寫明的年份或範圍；沒有把握的統計不寫。

export const ISLANDS = [
  {
    id: "charity",
    name: "慈善",
    seal: "慈",
    motto: "大慈無悔",
    order: 1,
    mission: true,
    blurb: "慈善是這棵樹的根。從花蓮的竹筒歲月開始，把善款親手送到人身邊。",
    color: "#24588a",
    accent: "#d7a24e",
    roof: "#8d5a32",
    wall: "#f7f3ea",
    at: [ -12.0, 3.6 ],
    deeds: [
      {
        id: "bamboo",
        title: "竹筒歲月",
        building: "pavilion",
        summary: "1966年，證嚴上人在臺灣花蓮創立「佛教克難慈濟功德會」。上人與五位弟子縫製嬰兒鞋、從事農作；三十位家庭主婦每天從買菜錢裡省下五角，投入竹筒，作為幫助孤老貧病的救助金。",
        heart: "再小的五角錢，天天省下來，就把自己的生活和別人的苦難連在一起。",
        facts: [
          "1966年於臺灣花蓮創立佛教克難慈濟功德會",
          "初期與五位弟子，以縫製嬰兒鞋、農作開展慈善",
          "三十位家庭主婦每天省下五角錢投入竹筒"
        ],
        sources: [
          { title: "大慈無悔・慈濟慈善志業簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/大慈無悔-慈濟慈善志業簡介" }
        ]
      },
      {
        id: "five-ways",
        title: "親手遍布施",
        building: "house",
        summary: "慈善要直接、重點、務實。從訪視、發放到追蹤，都由委員親自走。長期濟助、急難濟助、房屋修繕、冬令發放、大型賑災，是基金會頁面所寫、沿用至今的五種基本模式；早年也整理出勘災、造冊、發放的作法。",
        heart: "善款要走到人的手上，也要走到人的心裡。親自走一趟，才知道苦在哪裡。",
        facts: [
          "五種基本模式：長期濟助、急難濟助、房屋修繕、冬令發放、大型賑災",
          "善款運用秉持「誠正信實」，一元當兩元用",
          "首次冬令救濟，受惠的照顧戶有四十多戶、二百餘人"
        ],
        sources: [
          { title: "大慈無悔・慈濟慈善志業簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/大慈無悔-慈濟慈善志業簡介" }
        ]
      },
      {
        id: "families-2024",
        title: "弱勢家庭的日常",
        building: "hall",
        summary: "2024年度報告書把弱勢家庭扶助寫成很具體的日常：每月生活補助、居家關懷、急難補助、寒冬送暖、房屋修繕，還有醫療與節慶、喪葬等協助。數字是那一年的戶次，不是口號。",
        heart: "心念不是只在大災時才亮。每個月的訪視、每一戶修繕，都是把人安頓回生活裡。",
        facts: [
          "2024年：每月生活補助 134,028 戶次",
          "居家關懷 204,860 戶次；急難補助 12,971 戶次",
          "寒冬送暖 30,122 個家庭；房屋修繕 588 個家庭"
        ],
        sources: [
          { title: "2024年度報告書（弱勢家庭扶助）", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/年度報告書" },
          { title: "2024年度報告書電子書", outlet: "慈濟基金會", url: "https://fliphtml5.com/pkeed/zknz/" }
        ]
      },
      {
        id: "quake-0403",
        title: "0403 花蓮地震",
        building: "relief",
        summary: "2024年度報告書以「0403花蓮地震」記錄這次關懷，並寫下芮氏規模7.2。4月4日啟動急難應急金發放，花蓮慈濟醫院中醫團隊進駐，為搜救隊員服務。6月2日與花蓮縣政府簽約，援建中繼永久屋144戶，9月14日動土。",
        heart: "災害來的時候，心念就是立刻到場：先把人安頓，再一戶一戶把家補回來。",
        facts: [
          "報告書記載 0403 花蓮地震為芮氏規模 7.2",
          "4月4日啟動急難應急金發放，中醫團隊服務搜救隊員",
          "6月2日簽約援建中繼永久屋 144 戶，9月14日動土"
        ],
        sources: [
          { title: "2024年度報告書（0403 花蓮地震關懷）", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/年度報告書" },
          { title: "2024年度報告書電子書", outlet: "慈濟基金會", url: "https://fliphtml5.com/pkeed/zknz/" }
        ]
      },
      {
        id: "cycle-of-good",
        title: "教富濟貧、濟貧教富",
        building: "gate",
        summary: "基金會寫道：教富濟貧，是富者因施而樂；濟貧教富，是啟發貧困者也富有愛的心懷，有一天能再去幫助別人。2003年，以「台灣佛教慈濟基金會」之名，成為聯合國新聞部非政府組織聯繫單位的一員。年年不變的願景，是人心淨化、社會祥和、天下無災無難。",
        heart: "幫助人，也是把自己的心打開。善若能循環，付出就不會停在一次。",
        facts: [
          "慈善精神寫作「教富濟貧、濟貧教富」",
          "2003年成為聯合國新聞部非政府組織聯繫單位",
          "願景：人心淨化、社會祥和、天下無災無難"
        ],
        sources: [
          { title: "大慈無悔・慈濟慈善志業簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/大慈無悔-慈濟慈善志業簡介" },
          { title: "願景與使命", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/願景與使命" }
        ]
      }
    ]
  },
  {
    id: "medicine",
    name: "醫療",
    seal: "醫",
    motto: "守護生命",
    order: 2,
    mission: true,
    blurb: "因病而貧，所以把醫院建在最需要的地方，也把義診帶到路上。",
    color: "#1f7a78",
    accent: "#1f7a78",
    roof: "#d5e6e4",
    wall: "#f7fbfb",
    at: [ 9.2, -10.5 ],
    deeds: [
      {
        id: "hualien-hospital",
        title: "花蓮那一念",
        building: "hospital",
        summary: "人醫會頁記載：1965年，證嚴上人看見花蓮豐濱一位原住民母親小產的一灘血；1972年，在花蓮市仁愛街設立義診所。教育志業頁寫道：1986年8月，佛教慈濟醫院矗立於花蓮。入口網站說，以生命平等為念，不收醫療保證金，讓貧者也能就醫。",
        heart: "看到一灘血而發的那一念，若能持之以恆，就會變成一間守護東部的醫院。",
        facts: [
          "1972年於花蓮市仁愛街設立義診所",
          "1986年8月，佛教慈濟醫院矗立於花蓮",
          "以生命平等為念，不收醫療保證金"
        ],
        sources: [
          { title: "總召集人的話", outlet: "國際慈濟人醫會", url: "https://www.tzuchi.com.tw/tima/index.php/yuan-qi/zong-zhao-ji-ren-de-hua" },
          { title: "大捨無求・慈濟教育志業簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/大捨無求-慈濟教育志業簡介" },
          { title: "醫療志業簡述", outlet: "慈濟入口網站", url: "https://charity.tzuchi.org.tw/認識我們/慈濟志業/醫療" }
        ]
      },
      {
        id: "hospital-net",
        title: "醫院與診所的網",
        building: "campus",
        summary: "基金會頁面列出醫療志業的據點：花蓮慈濟醫學中心、玉里慈濟醫院、關山慈濟醫院、台北慈濟醫院、台中慈濟醫院、斗六慈濟醫院、大林慈濟醫院，以及嘉義慈濟診所、三義慈濟中醫醫院。東部與西部，都有一扇可以推開的門。",
        heart: "醫院不只在大城市。把據點留在玉里、關山，是記得後山的人。",
        facts: [
          "頁面列出花蓮、玉里、關山、台北、台中、斗六、大林",
          "另有嘉義慈濟診所、三義慈濟中醫醫院",
          "骨髓幹細胞中心也列在醫療志業的連結中"
        ],
        sources: [
          { title: "醫療志業據點", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/醫療" },
          { title: "醫療志業簡述", outlet: "慈濟入口網站", url: "https://charity.tzuchi.org.tw/認識我們/慈濟志業/醫療" }
        ]
      },
      {
        id: "four-whole",
        title: "四全照顧",
        building: "clinic",
        summary: "入口網站寫道：同步推動醫療志工，配合醫護團隊，做到全程、全人、全家、全隊的「四全」照顧，走向身、心、靈一起被看見。志工不是替醫師說話，是在病床邊把人的名字、家人的擔心，一起放進照顧裡。",
        heart: "看病的是一個完整的人。四全，是提醒我們不要只看見疾病。",
        facts: [
          "全程、全人、全家、全隊，稱為四全照顧",
          "醫療志工配合醫護團隊",
          "目標寫作身、心、靈的統合療護"
        ],
        sources: [
          { title: "醫療志業簡述", outlet: "慈濟入口網站", url: "https://charity.tzuchi.org.tw/認識我們/慈濟志業/醫療" }
        ]
      },
      {
        id: "tima",
        title: "志為人醫",
        building: "pavilion",
        summary: "1996年10月12日，臺灣慈濟醫事人員聯誼會在台北分會召開全省首次幹部會議。1998年正式定名「國際慈濟人醫會」（TIMA）。同年4月4日在夏威夷籌備，10月31日於洛杉磯的座談會，把它定為醫療志業的志工團體：跨國義診，也配合國際賑災。",
        heart: "白袍走到沒有醫院的地方，是把「視病如親」從院內帶到路上。",
        facts: [
          "1996年10月12日，醫事人員聯誼會首次幹部會議",
          "1998年定名國際慈濟人醫會（TIMA）",
          "工作包含社區義診，以及配合賑災的醫療救助"
        ],
        sources: [
          { title: "志為人醫", outlet: "國際慈濟人醫會", url: "https://www.tzuchi.com.tw/tima/index.php/yuan-qi/zhi-wei-ren-yi" },
          { title: "總召集人的話", outlet: "國際慈濟人醫會", url: "https://www.tzuchi.com.tw/tima/index.php/yuan-qi/zong-zhao-ji-ren-de-hua" }
        ]
      }
    ]
  },
  {
    id: "education",
    name: "教育",
    seal: "教",
    motto: "大捨無求",
    order: 3,
    mission: true,
    blurb: "從幼教到研究所，把尊重生命、肯定人性放進每天的生活。",
    color: "#8a6232",
    accent: "#c4a15a",
    roof: "#a15a3a",
    wall: "#fbf6ee",
    at: [ -7.9, -9.2 ],
    deeds: [
      {
        id: "full-education",
        title: "完全化教育",
        building: "school",
        summary: "東部缺醫護，也有原住民少女就學就業的難題。上人在籌建醫院時萌念辦教育。基金會頁記載：1987年開始籌辦慈濟護專，至2000年7月，完成幼稚園、小學、中學、大學到研究所。校訓是慈悲喜捨，宗旨是尊重生命、肯定人性。",
        heart: "教育等得久。把方向調正的孩子，長大後會自己去愛人。",
        facts: [
          "1987年開始籌辦慈濟護專",
          "2000年7月完成幼教到研究所的全程教育",
          "校訓「慈悲喜捨」，目標含品德、生活與全人教育"
        ],
        sources: [
          { title: "大捨無求・慈濟教育志業簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/大捨無求-慈濟教育志業簡介" }
        ]
      },
      {
        id: "campuses",
        title: "校園裡的志業",
        building: "tower",
        summary: "基金會的教育志業連結，列出慈濟大學、慈大附中、臺南慈中，以及社會教育推廣中心、華語中心、志玄終身學習教育中心。學校是一條線，社會教育是把同一念心延伸到校園外面。",
        heart: "一所學校立在東部，是告訴孩子：好醫師、好老師，也可以從這裡出發。",
        facts: [
          "連結列出慈濟大學、慈大附中、臺南慈中",
          "另有社會教育推廣、華語與終身學習場域",
          "教育頁說：四大志業、八大法印都是全人教育的一環"
        ],
        sources: [
          { title: "找慈濟・教育志業連結", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/找慈濟" },
          { title: "大捨無求・慈濟教育志業簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/大捨無求-慈濟教育志業簡介" }
        ]
      },
      {
        id: "jing-si-words",
        title: "靜思語與大愛媽媽",
        building: "house",
        summary: "教育不只在學校。基金會頁寫著：兒童班、青少年成長班、慈濟大專青年聯誼會、社會推廣教育走入社區；教師聯誼會推動靜思語教學，並與社區志工組成大愛媽媽，在校園做生命教育。泰北設有慈濟學校，海外也有人文學校與大愛幼兒園。",
        heart: "一句靜思語若能在家裡被說出來，教室和客廳就接在一起了。",
        facts: [
          "教師聯誼會推動靜思語教學",
          "大愛媽媽在校園推廣生命教育",
          "泰北設立慈濟學校；海外有人文學校與大愛幼兒園"
        ],
        sources: [
          { title: "大捨無求・慈濟教育志業簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/大捨無求-慈濟教育志業簡介" }
        ]
      },
      {
        id: "sprout",
        title: "新芽獎學金",
        building: "hall",
        summary: "2024年度報告書寫道：當年共有9200位學子獲頒新芽獎學金，頒獎在臺中靜思堂，並搭配大學博覽會。428位獲獎高中生參加，34所大學設攤，59位學長姊及志工分享醫學、工程、藝術等科系的真實路程。",
        heart: "助學金不是施捨，是陪一個年輕人把自己的路看清楚。",
        facts: [
          "2024年 9,200 位學子獲頒新芽獎學金",
          "頒獎典禮在臺中靜思堂，並辦大學博覽會",
          "428 位獲獎高中生、34 所大學、59 位學長姊及志工分享"
        ],
        sources: [
          { title: "2024年度報告書（新芽頒獎博覽會）", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/年度報告書" },
          { title: "2024年度報告書電子書", outlet: "慈濟基金會", url: "https://fliphtml5.com/pkeed/zknz/" }
        ]
      }
    ]
  },
  {
    id: "culture",
    name: "人文",
    seal: "文",
    motto: "大喜無憂",
    order: 4,
    mission: true,
    blurb: "用文字、聲音和一座安靜的堂，把人間的真善美留住。",
    color: "#8e4d62",
    accent: "#c47c92",
    roof: "#6e4456",
    wall: "#fbf7f8",
    at: [ 0.8, -18.7 ],
    deeds: [
      {
        id: "monthly",
        title: "慈濟月刊",
        building: "hall",
        summary: "1967年7月，《慈濟》月刊創刊。雖從徵信開始，也轉載佛理與好人好事，基金會稱之為人文志業的濫觴。刊物、書籍、廣播、電視，都要報導真實，也要引導善的方向。2004年11月，原「文化志業」更名為「人文志業」。",
        heart: "把善款的去向說清楚，也把人的好寫下來，信賴才有地方安放。",
        facts: [
          "1967年7月《慈濟》月刊創刊",
          "從徵信延伸到佛理與好人好事",
          "2004年11月，文化志業更名為人文志業"
        ],
        sources: [
          { title: "大喜無憂・慈濟人文志業簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/大喜無憂-慈濟人文志業簡介" }
        ]
      },
      {
        id: "daai-tv",
        title: "大愛電視台",
        building: "studio",
        summary: "大愛電視記載：前身「慈濟世界」於1995年12月1日開播；1998年1月1日下午2點，大愛電視台正式開播。當晚在臺北中正紀念堂與花蓮靜思堂道侶廣場同步舉行晚會。上人期許媒體做人們的清明眼目，收集美好，播送光明。",
        heart: "螢幕可以播送喧鬧，也可以把真善美送進客廳。選擇後者，是一種心念。",
        facts: [
          "1995年12月1日，「慈濟世界」節目開播",
          "1998年1月1日，大愛電視台正式開播",
          "開播晚會在臺北與花蓮兩地同步舉行"
        ],
        sources: [
          { title: "大愛20・為愛堅持", outlet: "大愛電視", url: "https://tcmaster.daai.tv/2017/12/26/%e5%a4%a7%e6%84%9b20-%e7%82%ba%e6%84%9b%e5%a0%85%e6%8c%81/" },
          { title: "大喜無憂・慈濟人文志業簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/大喜無憂-慈濟人文志業簡介" }
        ]
      },
      {
        id: "jing-si-hall",
        title: "靜思堂無聲說法",
        building: "temple",
        summary: "基金會頁寫道：花蓮慈濟靜思堂於1986年動土，之後各地陸續興建靜思堂與分支會所。取於社會、用於社會，是慈濟人的家，也是社區的教育道場。上人說，靜思堂要讓人一進來就在寧靜中沉思，目光所至就能收攝法理。",
        heart: "有時候不用多說一句話，一座安靜的堂，就已經在說法。",
        facts: [
          "花蓮慈濟靜思堂 1986 年動土興建",
          "建築講求靜思寧靜、淨如琉璃、莊嚴樸實",
          "兼具弘法、學術教育與社區推廣"
        ],
        sources: [
          { title: "大喜無憂・慈濟人文志業簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/大喜無憂-慈濟人文志業簡介" }
        ]
      },
      {
        id: "guandu",
        title: "關渡人文寶塔",
        building: "tower",
        summary: "2023年1月1日，關渡靜思堂啟用，也是大愛電視25週年。人文志業中心遷入這裡，包含大愛電視、平面出版與數位媒材。基金會為人文寫下四句任務：為心靈淨化作活水、為祥和社會作砥柱、為聞聲救苦作耳目、為顛狂荒亂作正念。",
        heart: "把總部安在社區旁邊，是希望真善美不要只停在螢幕上，也能走進鄰里。",
        facts: [
          "2023年1月1日關渡靜思堂啟用、大愛電視25週年",
          "人文志業包含大愛電視、慈濟月刊、經典雜誌等",
          "四句任務寫在人文志業的自我期許裡"
        ],
        sources: [
          { title: "大愛電視25週年・關渡靜思堂啟用", outlet: "大愛電視", url: "https://www.daai.tv/announcement/119" },
          { title: "關渡靜思堂導覽", outlet: "慈濟傳播人文志業基金會", url: "https://tzuchiculture.org/visitor/guided-tour/" },
          { title: "大喜無憂・慈濟人文志業簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/大喜無憂-慈濟人文志業簡介" }
        ]
      }
    ]
  },
  {
    id: "intl",
    name: "國際賑災",
    seal: "賑",
    motto: "直接尊重",
    order: 5,
    mission: false,
    blurb: "從孟加拉的一人一元開始，把臺灣的愛心存底送到海的另一邊。",
    color: "#2a6f97",
    accent: "#2a6f97",
    roof: "#234864",
    wall: "#f3f7fb",
    at: [ 4.1, 16.9 ],
    deeds: [
      {
        id: "bangladesh",
        title: "孟加拉的一人一元",
        building: "warehouse",
        summary: "1991年4月，颶風哥奇襲擊孟加拉。美國分會發起「一人一元」，上人呼籲每人節省一個麵包的錢來響應。基金會頁記載：一個月內募得十五萬七千餘美元，轉交美國紅十字會，協助災後重建，也為慈濟的國際救援拉開序幕。",
        heart: "國際賑災的第一步，不是遠方的大計畫，而是把自己的一份麵包錢送出去。",
        facts: [
          "1991年4月，自孟加拉水患揭開國際賑災序幕",
          "一個月募得十五萬七千餘美元，轉交美國紅十字會",
          "基金會頁記載：統計至2024年3月，援助136個國家地區"
        ],
        sources: [
          { title: "慈濟國際賑災簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/慈濟國際賑災簡介" },
          { title: "大慈無悔・慈濟慈善志業簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/大慈無悔-慈濟慈善志業簡介" }
        ]
      },
      {
        id: "relief-way",
        title: "六個原則",
        building: "hall",
        summary: "走過大陸賑災的試煉後，基金會寫下國際救援的原則：直接、重點、尊重、務實、感恩、及時。做法有四種：慈濟親自勘災發放與監造；與信譽卓著的國際組織合作；本會與海外據點合力；海外慈濟人就地取之、用之於當地。",
        heart: "救災要快，更要尊敬對方。把物資交到手上時，人的尊嚴也要一起保住。",
        facts: [
          "原則：直接、重點、尊重、務實、感恩、及時",
          "四種形式，從親自勘災到與國際組織合作",
          "並以剩餘款成立國際急難救助基金"
        ],
        sources: [
          { title: "慈濟國際賑災簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/慈濟國際賑災簡介" }
        ]
      },
      {
        id: "tihaa",
        title: "人道援助的後勤",
        building: "factory",
        summary: "2003年11月，企業家志工成立「慈濟國際人道援助會」，研發兼顧賑災即時與環保再生的物資，讓急難時的食、衣、住、行與資訊有人準備。大愛感恩科技頁也寫道：2006年，開始用回收寶特瓶做出賑災毛毯。",
        heart: "愛要及時，背後得有人把毯子、糧食和流程準備好。這也是一種靜靜的付出。",
        facts: [
          "2003年11月成立慈濟國際人道援助會（TIHAA）",
          "著重賑災物資的後勤、行政與研發",
          "2006年起以回收寶特瓶發展賑災毛毯"
        ],
        sources: [
          { title: "慈濟志業緣起", outlet: "大愛感恩科技", url: "https://www.daait.com/index.php/tc/aboutus/2012-05-25-07-42-47" },
          { title: "大慈無悔・慈濟慈善志業簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/大慈無悔-慈濟慈善志業簡介" }
        ]
      },
      {
        id: "overseas-2024",
        title: "2024 仍在路上",
        building: "boat",
        summary: "2024年度報告書寫道：當年以解除飢餓與貧窮、氣候與人道救援等行動，在臺灣與海外55個國家展開慈善關懷；海外扶困並在43個國家進行，內容包含生活、教育、營養、生計、水資源與健康衛生。同一份全球行動力頁記載，臺灣大米已於20個國家／地區發放158,520公噸。",
        heart: "賑災不是做完一次就結束。隔年仍有人餓、仍沒有乾淨的水，腳步就還要繼續。",
        facts: [
          "2024年於臺灣與海外 55 個國家展開關懷與人道援助",
          "海外扶困行動涵蓋 43 個國家",
          "報告書記載臺灣大米已於 20 個國家／地區發放 158,520 公噸"
        ],
        sources: [
          { title: "2024年度報告書", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/年度報告書" },
          { title: "2024年度報告書電子書", outlet: "慈濟基金會", url: "https://fliphtml5.com/pkeed/zknz/" }
        ]
      }
    ]
  },
  {
    id: "marrow",
    name: "骨髓捐贈",
    seal: "髓",
    motto: "無損己身",
    order: 6,
    mission: false,
    blurb: "為血液病的人留一扇門。捐的人與受的人不必相認，生命卻會相遇。",
    color: "#a85a6a",
    accent: "#b76a78",
    roof: "#7d4452",
    wall: "#fbf7f6",
    at: [ 10.5, 3.3 ],
    deeds: [
      {
        id: "marrow-center",
        title: "資料中心成立",
        building: "hall",
        summary: "留美學生溫文玲罹患白血病，當時法令限制非親屬不能捐髓。1993年5月法令修正開放。人文志業記載：1993年10月20日，「慈濟基金會臺灣骨髓捐贈資料中心」成立，秉持全民共享，不專屬慈濟，各醫院有需要都可以使用。",
        heart: "一個人的求生，促成整個社會願意把手臂伸出來。這扇門是為所有血液病的人開的。",
        facts: [
          "1993年5月，法令開放非親屬間骨髓捐贈",
          "1993年10月20日，骨髓捐贈資料中心成立",
          "資料庫不專屬慈濟，各醫院可提出使用"
        ],
        sources: [
          { title: "骨髓庫的誕生", outlet: "慈濟傳播人文志業基金會", url: "https://web.tzuchiculture.org.tw/?book=602&mp=6059" },
          { title: "慈濟月刊 426 期・骨髓中心沿革", outlet: "慈濟月刊", url: "https://web.tzuchiculture.org.tw/tpenquart/monthly/426/426c3-6.htm" }
        ]
      },
      {
        id: "first-transplant",
        title: "第一例，以及跨海",
        building: "clinic",
        summary: "慈濟月刊記載：1994年5月，十七歲的魏志祥完成臺灣首宗非親屬骨髓移植。同年9月，一位十九歲女學生捐出的骨髓送到新加坡中央醫院，幫助十六歲的馬來西亞華裔少女，成為首宗跨國捐髓。捐的人與受的人原本互不相識。",
        heart: "你不必認識對方，也能把生的機會送出去。這是很安靜、也很勇敢的愛。",
        facts: [
          "1994年5月，魏志祥完成臺灣首例非親屬骨髓移植",
          "1994年9月完成首宗跨國捐髓",
          "捐贈者與受贈者互不相識，緣分在配對上"
        ],
        sources: [
          { title: "慈濟月刊 426 期・骨髓中心沿革", outlet: "慈濟月刊", url: "https://web.tzuchiculture.org.tw/tpenquart/monthly/426/426c3-6.htm" }
        ]
      },
      {
        id: "stem-cell",
        title: "骨髓、周邊血、臍帶血",
        building: "lab",
        summary: "2002年4月30日，資料中心擴編為「慈濟骨髓幹細胞中心」。中心官網說明，造血幹細胞可以來自骨髓、周邊血或臍帶血；目前最常用的是周邊血：施打白血球生長激素後，以類似捐血小板的方式分離採集，無需麻醉。",
        heart: "名字從捐贈中心變成幹細胞中心，變的是醫學。不變的是救人一命、無損己身。",
        facts: [
          "2002年4月30日改制為慈濟骨髓幹細胞中心",
          "三種來源：骨髓、周邊血、臍帶血",
          "中心位於花蓮市中央路，志工陪伴配對與捐贈"
        ],
        sources: [
          { title: "慈濟月刊 426 期・骨髓中心沿革", outlet: "慈濟月刊", url: "https://web.tzuchiculture.org.tw/tpenquart/monthly/426/426c3-6.htm" },
          { title: "造血幹細胞配對與捐贈", outlet: "慈濟骨髓幹細胞中心", url: "https://btcscc.tzuchi.com.tw/zh_hant/stemcell" }
        ]
      },
      {
        id: "walk-with",
        title: "勸髓、捐髓、陪髓",
        building: "house",
        summary: "中心把流程寫成三步：初配、確認、捐贈。初配時會詢問捐贈者的意願；確認後做體檢，再正式捐贈。志工一路陪同。建檔年齡，月刊與醫院頁都寫著年滿18歲、未滿46歲。捐與受都要被保護，不能因為救人而傷害另一個人。",
        heart: "陪一個人做決定，比催促更難。尊重他的願，才是真正把生命當一回事。",
        facts: [
          "流程分為初配、確認、捐贈，並詢問捐贈者意見",
          "驗血建檔年齡：年滿 18 歲、未滿 46 歲",
          "醫療審核要同時保護捐贈者與受贈者"
        ],
        sources: [
          { title: "造血幹細胞配對與捐贈", outlet: "慈濟骨髓幹細胞中心", url: "https://btcscc.tzuchi.com.tw/zh_hant/stemcell" },
          { title: "我可以成為捐髓者嗎", outlet: "慈濟傳播人文志業基金會", url: "https://web.tzuchiculture.org.tw/?book=602&mp=6053" },
          { title: "骨髓捐贈參加條件", outlet: "台中慈濟醫院", url: "https://taichung.tzuchi.com.tw/index.php/duo-yuan-juan-zeng/gu-sui-juan-zeng" }
        ]
      }
    ]
  },
  {
    id: "eco",
    name: "環保",
    seal: "環",
    motto: "惜福愛物",
    order: 7,
    mission: false,
    blurb: "把鼓掌的雙手用來彎腰。垃圾變黃金，黃金再變愛心。",
    color: "#3f7d62",
    accent: "#3f7d62",
    roof: "#2c5a46",
    wall: "#f4f7f2",
    at: [ -5.4, 12.3 ],
    deeds: [
      {
        id: "applause",
        title: "鼓掌的雙手",
        building: "shed",
        summary: "1990年8月23日，證嚴上人在臺中新民商工演講。清早看見夜市收攤後的垃圾；演講結束，看到熱烈的掌聲，便說：請把鼓掌的雙手用來撿垃圾、掃街道、做資源回收。豐原的楊順苓隨即在鄰里推動，慈濟人從此紛紛響應。",
        heart: "掌聲很響，彎下腰的手更實在。環保是從自己的街道開始修行。",
        facts: [
          "1990年8月23日，臺中一場演講點燃資源回收",
          "上人說：垃圾變黃金，黃金變愛心",
          "志工被尊稱為環保菩薩、清淨菩薩"
        ],
        sources: [
          { title: "慈濟環保志業簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/慈濟環保志業簡介" }
        ]
      },
      {
        id: "eco-stations",
        title: "社區裡的環保站",
        building: "bins",
        summary: "志工不分年齡，視街頭為道場，低頭彎腰做分類。人文志業頁寫著，回收所得用來護持人文，把人間真善美的故事送出去：垃圾變黃金，黃金變愛心，愛心化清流。關渡導覽頁並寫道，大愛感恩科技的寶特瓶，來自全臺慈濟環保站與環保志工分類的1號飲用水瓶。",
        heart: "一個人彎腰，看起來只是分類瓶子。很多人彎腰，就是在替地球減輕一點傷。",
        facts: [
          "環保站從社區出發，帶動左鄰右舍一起做",
          "回收護持人文志業的傳播",
          "導覽頁寫：寶特瓶來自全臺 5,637 個環保站、超過 20 萬名環保志工分類"
        ],
        sources: [
          { title: "慈濟環保志業簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/慈濟環保志業簡介" },
          { title: "大喜無憂・慈濟人文志業簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/大喜無憂-慈濟人文志業簡介" },
          { title: "關渡靜思堂導覽・大愛環保科技人文館", outlet: "慈濟傳播人文志業基金會", url: "https://tzuchiculture.org/visitor/guided-tour/" }
        ]
      },
      {
        id: "daai-tech",
        title: "大愛感恩科技",
        building: "factory",
        summary: "大愛感恩科技頁寫下這條線：2006年做出第一條回收寶特瓶的賑災毛毯；2008年，為推廣寶特瓶回收再生並護持四大志業，成立大愛感恩科技；2009年織品在靜思書軒上架；2010年，五位實業家把百分之百股權捐贈慈濟基金會。",
        heart: "瓶子可以變成毯子，再送到災區。物的命被延長，愛也跟著走遠一點。",
        facts: [
          "2006年，第一條回收寶特瓶賑災毛毯",
          "2008年成立大愛感恩科技股份有限公司",
          "2010年，百分之百股權捐贈慈濟基金會"
        ],
        sources: [
          { title: "慈濟志業緣起", outlet: "大愛感恩科技", url: "https://www.daait.com/index.php/tc/aboutus/2012-05-25-07-42-47" }
        ]
      },
      {
        id: "earth-and-heart",
        title: "大地與心地",
        building: "bus",
        summary: "基金會頁說，建築要讓大地呼吸：大量植栽、鋪連鎖磚、雨水回收，並重視自然採光與通風。從大地到心地，則是蔬食、簡約、減少碳足跡。2024年度報告書寫道：2020年與大愛感恩科技打造行動環保教育車，五年來累計超過27萬人次參訪；該節並記載44場巡展、49,475人次體驗。",
        heart: "護大地和護心地是同一件事。少浪費一點，心就寬一點。",
        facts: [
          "建築使用連鎖磚、雨水回收與自然採光通風",
          "2020年打造行動環保教育車；報告書寫五年來超過 27 萬人次參訪",
          "同一節記載 44 場巡展、49,475 人次體驗"
        ],
        sources: [
          { title: "慈濟環保志業簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/慈濟環保志業簡介" },
          { title: "2024年度報告書（行動環保教育車）", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/年度報告書" },
          { title: "2024年度報告書電子書", outlet: "慈濟基金會", url: "https://fliphtml5.com/pkeed/zknz/" }
        ]
      }
    ]
  },
  {
    id: "community",
    name: "社區志工",
    seal: "區",
    motto: "里仁為美",
    order: 8,
    mission: false,
    blurb: "最近的菩薩道，往往就在同一條街上。委員、慈誠，還有每一種志工。",
    color: "#5c6e86",
    accent: "#c4a574",
    roof: "#8d6a3e",
    wall: "#f8f4ec",
    at: [ -0.5, 0.3 ],
    deeds: [
      {
        id: "community-1997",
        title: "走回厝邊",
        building: "house",
        summary: "1997年，證嚴上人推動社區化編組，重新整編委員和慈誠。基金會頁說，要讓厝邊鄰里得到及時關懷：掃街、資源回收、關懷老人、照料貧戶，也辦婦女成長班、親子成長班。上人期許恢復社區的溫情，實踐「里仁為美」。",
        heart: "最近的菩薩道，往往就在同一條街上。先認識隔壁的人，急難才找得到彼此。",
        facts: [
          "1997年開始社區化志工編組",
          "委員、慈誠回到里鄰做關懷",
          "也辦婦女成長班、親子成長班，凝聚社區感情"
        ],
        sources: [
          { title: "慈濟社區志工簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/社區志工" }
        ]
      },
      {
        id: "quake-921",
        title: "九二一那天的網",
        building: "pavilion",
        summary: "基金會頁以九二一說明社區志工為什麼要緊密。1999年9月21日凌晨1點47分地震。不到2點半，慈濟人已在松山東星大樓與新莊博士的家協助；3點，臺中分會救災中心成立；清晨5點半，災變現場開始供應熱食。平日熟悉的鄰里，在夜裡變成一張找得到人的網。",
        heart: "平日的一聲問候，在災難的夜裡就變成可以送上熱食的路。",
        facts: [
          "1999年9月21日凌晨1時47分地震",
          "不到2點半，志工出現在東星大樓與博士的家",
          "清晨5點半，災變現場開始供應早餐"
        ],
        sources: [
          { title: "慈濟社區志工簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/社區志工" }
        ]
      },
      {
        id: "every-role",
        title: "每一種志工都算數",
        building: "kitchen",
        summary: "有人上班前到會所掃地，做福田志工；有人做環保、香積、人文紀錄，或到校園當大愛媽媽。功能不同，都回歸社區。機構關懷頁也寫：安養、育幼、身心障礙、監獄與街友機構，除了物資，還有陪伴、義診、衛教與按摩。",
        heart: "不一定要做很大的事。把一餐飯煮好、把一間會所掃乾淨，都是在守望這個社區。",
        facts: [
          "福田、香積、人文、大愛媽媽，都是社區志工",
          "居民可以主動聯絡會所，說想當志工",
          "機構關懷包含定期陪伴、義診與衛教"
        ],
        sources: [
          { title: "慈濟社區志工簡介", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/認識我們/慈濟志業/社區志工" },
          { title: "社區機構關懷", outlet: "慈濟入口網站", url: "https://charity.tzuchi.org.tw/what-we-do/community-charity/community-organization-care" }
        ]
      },
      {
        id: "elder-care",
        title: "健康送到巷口",
        building: "clinic",
        summary: "2024年度報告書在長者關懷中寫道：為了縮短城鄉醫療資源的差距，基金會、慈濟醫院與在地衛生所合作，把多功能檢測儀送到新竹縣、嘉義縣的原鄉與偏鄉衛生所。訪視時也看家裡的扶手、照明與止滑，需要的人再繼續陪伴。",
        heart: "健康不要等倒下來才談。巷口多一個願意關心的人，就是多一份及時的安心。",
        facts: [
          "檢測儀送到新竹縣、嘉義縣的原鄉與偏鄉衛生所",
          "儀器整合血壓、心電圖、血氧、血糖等項目",
          "長者關懷包含居家安全改善與後續陪伴"
        ],
        sources: [
          { title: "2024年度報告書（長者與社區健康）", outlet: "慈濟基金會", url: "https://www.tzuchi.org.tw/年度報告書" },
          { title: "2024年度報告書電子書", outlet: "慈濟基金會", url: "https://fliphtml5.com/pkeed/zknz/" }
        ]
      }
    ]
  }
];

export const LINKS = [
  ["culture", "education"],
  ["culture", "medicine"],
  ["education", "charity"],
  ["education", "community"],
  ["medicine", "marrow"],
  ["medicine", "community"],
  ["charity", "community"],
  ["charity", "eco"],
  ["community", "eco"],
  ["community", "intl"],
  ["eco", "intl"],
  ["marrow", "intl"]
];

export function deedCount() {
  return ISLANDS.reduce((sum, island) => sum + island.deeds.length, 0);
}

export function findDeed(id) {
  for (const island of ISLANDS) {
    const deed = island.deeds.find((item) => item.id === id);
    if (deed) return { island, deed };
  }
  return null;
}
