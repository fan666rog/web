document.addEventListener('DOMContentLoaded', () => {
    // --- DATA SOURCE FROM sn.txt ---
    const calculationMethod = `【生命靈數計算方式】
想知道你的生命靈數只需將自己的西元出生年月日全部數字加總，若得出的數字是二位數，便繼續相加直至成為個位數字。\n例如1988/01/23出生的人，生命靈數即為1+9+8+8+0+1+2+3=32，3+2 = 5，此人為5號人。`;

    const gridCalculationMethod = `【生命靈數九宮格是什麼？】
在基本了解生命靈數後，還可進一步透過繪製「生命靈數九宮格」深入剖析自己。\n本計算機會自動找出您的「先天數」、「生命數」、「天賦數」及「星座數」，並將這些數字圈入九宮格中。\n
「先天數」：即為你的西元出生年月日數字。（舉例：1988/01/23，那麼先天數就為「1、9、8、8、1、2、3」。)\n
「生命數」：即為你的生命靈數。（舉例：1988/01/23出生的人，1+9+8+8+0+1+2+3=32，3+2 = 5，你的生命數就是5。）\n
「天賦數」：有兩個數字，即是把西元出生年月日全部數字相加、計算至二位數字。（舉例：1+9+8+8+0+1+2+3=32，你的天賦數就是3跟2）\n
「星座數」：每個星座都有自己代表的數字。\n
圈圈愈多的數字代表你擁有它的能量愈高，而九宮格上沒有的數字即為「空缺數」。`;


    const lifePathMeanings = {
        1: "【1號人】\n正面特質是具有開創性，天生較獨立、領導能力強，在工作中適合擔任管理職。但缺點是容易太自我、忽略別人的想法，需要學會協調及與他人合作，身為1號人的伴侶也需要多提供他支持與尊重。",
        2: "【2號人】\n較為合群且具有同理心，適合從事如教師、心理諮詢工作，他們對於色彩與美感具有細膩感知，也被認為適合當藝術家。但2號人情緒易受外界影響，和戀人相處時也會較黏人、即便分手也可能和舊愛繼續當朋友，需學習不要過分倚賴他人，適合和能為另一半著想的人交往。",
        3: "【3號人】\n外向又具有創意、擅於社交，總是給人能量滿滿的感覺，適合從事公關、銷售與新聞業。在愛情中是浪漫主義者，容易一見鍾情，不過因為3號人較缺乏耐性，在一段關係中容易顯得忽冷忽熱，需要學習與伴侶深層溝通、加強責任感。",
        4: "【4號人】\n顯現出來的特質較為穩重務實、條理分明，喜歡按步驟或規章行事，重視長久的關係，在人際關係或愛情中都是可靠的伴侶，不過缺點是容易缺乏彈性，需要避免過度堅持，應學著適時妥協。",
        5: "【5號人】\n渴望自由與冒險，對很多事物感興趣，適合較有變化或彈性的工作，例如演藝、旅遊業等。在愛情上重視彼此擁有自己的空間，不喜歡受到約束、也較為害怕承諾，需要學習專注經營一段感情。",
        6: "【6號人】\n關懷他人的奉獻型人格，會照顧身邊的人也很具責任感，相對追求完美與固執。在愛情中若過度付出未獲得回報容易感到失落，需要學習適度放手、不要給伴侶太大壓力。",
        7: "【7號人】\n對事物感到好奇、喜歡追求真理、分析能力強，適合在團隊中擔任策略規劃者，但缺點是容易不夠圓融。需要學習表達情感、不要過分專注在自己的世界，適合能一起成長、探索各種事物的伴侶。",
        8: "【8號人】\n強勢有野心、具有商業頭腦，但要避免過度追求物質與成功，並試著學習同理他人；在戀愛中亦可能權衡利弊得失或對另一半有掌控欲，需適度給予對方空間。",
        9: "【9號人】\n大方、博愛的理想主義者，但在實踐與理想中間需要學習平衡，以及在幫助對方時試著尊重別人的選擇、不要過度干涉；在愛情中也傾向於付出，遇到問題慣於隱忍，需要學習和另一半溝通、表達真實想法。"
    };

    const missingNumberMeanings = {
        1: "【空缺數1】\n性格較隨和、缺乏主見，習慣依附團體而行動，也容易陷入自我懷疑，需要學習培養自我認同感與獨立性。",
        2: "【空缺數2】\n在人際關係中較為冷漠、不容易有同理心，較難與人建立深層關係，需要學習與別人溝通的技巧。",
        3: "【空缺數3】\n這類人較缺乏創意、較少表達自己的想法，可以多嘗試繪畫、寫作等活動，一方面抒發情感，一方面也開發自己的創意。",
        4: "【空缺數4】\n做事比較缺乏計畫與組織能力，可以試著從小地方開始擬定一些計畫並按部就班完成，讓自己建立規律與學習時間管理。",
        5: "【空缺數5】\n比較害怕改變、容易墨守成規，建議抱持開放的心胸嘗試新事物。",
        6: "【空缺數6】\n做事較為急躁、過於直率，也容易缺乏表達愛的能力，需要學習換位思考及在家庭關係中承擔責任。",
        7: "【空缺數7】\n比較缺乏內省，在邏輯思維上亦較為受限，遇到問題時建議多加思考、嘗試分析，不要習慣直接接受他人的意見。",
        8: "【空缺數8】\n較不戀棧權力或物質慾望，在感情中若遇到問題也容易放手，需要試著建立自信、向較具有積極心態的人學習。",
        9: "【空缺數9】\n較關注自身需求、容易讓人覺得對社會事務冷漠，不妨參與一些社區活動或公益活動，學習奉獻與拓展視野。"
    };

    const zodiacNumbers = {
        1: "牡羊座 & 摩羯座", 2: "金牛座 & 水瓶座", 3: "雙子座 & 雙魚座",
        4: "巨蟹座", 5: "獅子座", 6: "處女座",
        7: "天秤座", 8: "天蠍座", 9: "射手座"
    };

    // --- 新增：九宮格連線資料 ---
    const connectionLinesMeanings = {
        '147': { title: "1-4-7 主導執行力/務實線", description: "高度自律且具有行動力，比較不會做白日夢，相信努力付出才有收穫。" },
        '258': { title: "2-5-8 主導心智力", description: "情感豐富、能很好地表達自己內心的想法，對藝術感受力強也帶有浪漫特質。" },
        '369': { title: "3-6-9 又稱智慧線", description: "充滿智慧、學習力強，可以跳脫框架去思考。" },
        '123': { title: "1-2-3 主導藝術力", description: "較具藝術氣息、對「美」的感知力高，願意嘗試新事物。" },
        '456': { title: "4-5-6 主導組織規劃力", description: "做事情井然有序、具有責任感，善於為大家解決問題。" },
        '789': { title: "7-8-9 又稱權力線", description: "身邊常有貴人相助，充滿領袖氣質的魅力人格。" },
        '357': { title: "3-5-7 主導好人緣運", description: "有表達自己的慾望、能面面俱到，通常人緣極佳。" },
        '159': { title: "1-5-9 主導堅持力/事業線", description: "好惡分明，對事業充滿強烈企圖心，設定目標後會堅持地前進。" },
        '42': { title: "2-4 主導精簡和優化的能力", description: "反應快、懂得變通，喜歡以有效率的方式完成事情。" },
        '48': { title: "4-8 主導勤勞力", description: "喜歡穩定性、金錢觀較為務實，即便放假也時常閒不下來。" },
        '62': { title: "2-6 主導和平力", description: "性格溫暖，盡力維持和平、和諧的人際關係。" },
        '68': { title: "6-8 主導誠懇力", description: "誠懇且誠實，十分在意他人的想法。" }
    };


    // --- DOM Elements ---
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsSection = document.getElementById('results-section');
    const birthdateInput = document.getElementById('birthdate');
    const zodiacSelect = document.getElementById('zodiac');
    
    const summaryEl = document.getElementById('summary');
    const lifepathAnalysisEl = document.getElementById('lifepath-analysis');
    const numerologyGridEl = document.getElementById('numerology-grid');
    const missingNumbersSummaryEl = document.getElementById('missing-numbers-summary');
    const connectionsDetailsEl = document.getElementById('connections-details');
    const missingDetailsEl = document.getElementById('missing-details');

    const viewSourceBtn = document.getElementById('view-source-btn');
    const sourceModal = document.getElementById('source-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const sourceDataContentEl = document.getElementById('source-data-content');

    // --- Event Listeners ---
    calculateBtn.addEventListener('click', handleCalculation);
    viewSourceBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === sourceModal) {
            closeModal();
        }
    });

    // --- Functions ---
    function handleCalculation() {
        const birthdate = birthdateInput.value;
        const zodiacNum = zodiacSelect.value;

        if (!birthdate || !zodiacNum) {
            alert('請務必選擇您的生日和星座！');
            return;
        }

        const dateDigits = birthdate.replace(/-/g, '').split('').map(Number);
        
        let sum = dateDigits.reduce((acc, curr) => acc + curr, 0);
        const talentNumbers = String(sum).split('').map(Number);
        
        let lifePathNumber = sum;
        while (lifePathNumber > 9) {
            lifePathNumber = String(lifePathNumber).split('').map(Number).reduce((a, b) => a + b, 0);
        }
        
        const allNumbers = [...dateDigits, lifePathNumber, ...talentNumbers, Number(zodiacNum)];
        
        const counts = {};
        for (let i = 1; i <= 9; i++) {
            counts[i] = 0;
        }
        allNumbers.forEach(num => {
            if (num >= 1 && num <= 9) {
                counts[num]++;
            }
        });

        displayResults(lifePathNumber, talentNumbers, counts);
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // --- 新增：分析九宮格連線 ---
    function analyzeConnections(counts) {
        const prioritizedConnections = [];
        const normalConnections = [];
        const linesToCheck = ['147', '258', '369', '123', '456', '789', '357', '159', '42', '48', '62', '68'];

        linesToCheck.forEach(line => {
            const nums = line.split('').map(Number);
            const isConnected = nums.every(num => counts[num] > 0);

            if (isConnected) {
                const isPrioritized = nums.every(num => counts[num] >= 2);
                const lineInfo = connectionLinesMeanings[line];
                if (isPrioritized) {
                    prioritizedConnections.push(lineInfo);
                } else {
                    normalConnections.push(lineInfo);
                }
            }
        });
        return { prioritizedConnections, normalConnections };
    }


    function displayResults(lifePathNumber, talentNumbers, counts) {
        summaryEl.innerHTML = `
            <p>您的生命靈數是：<strong>${lifePathNumber}</strong> 號人</p>
            <p>您的天賦數是：<strong>${talentNumbers.join(' 和 ')}</strong></p>
        `;
        
        lifepathAnalysisEl.innerHTML = `<h3>你的主性格：生命靈數 ${lifePathNumber} 號人</h3><p>${lifePathMeanings[lifePathNumber].replace(/\n/g, '<br>')}</p>`;

        renderGrid(counts);
        renderMissingNumbers(counts);

        // --- 新增：呼叫連線分析與渲染 ---
        const { prioritizedConnections, normalConnections } = analyzeConnections(counts);
        renderConnections(prioritizedConnections, normalConnections);
    }
    
    // --- 修改：渲染連線結果 ---
    function renderConnections(prioritized, normal) {
        let html = '';

        if (prioritized.length === 0 && normal.length === 0) {
            html = '<p>您沒有任何主連線，這代表您的發展較為均衡，或潛力尚待開發。</p>';
            connectionsDetailsEl.innerHTML = html;
            return;
        }

        if (prioritized.length > 0) {
            html += `<h4 class="connection-group-title">主要特質</h4>`;
            html += prioritized.map(line => `
                <div class="connection-item">
                    <strong>${line.title}</strong>
                    <p>${line.description}</p>
                </div>
            `).join('');
        }

        // --- 修改重點：當兩者都存在時，加入分隔線 ---
        if (prioritized.length > 0 && normal.length > 0) {
            html += `<hr class="connection-divider">`;
        }

        if (normal.length > 0) {
            html += `<h4 class="connection-group-title">次要特質</h4>`;
            html += normal.map(line => `
                <div class="connection-item">
                    <strong>${line.title}</strong>
                    <p>${line.description}</p>
                </div>
            `).join('');
        }
        
        connectionsDetailsEl.innerHTML = html;
    }


    function renderGrid(counts) {
        numerologyGridEl.innerHTML = '';
        const gridOrder = [1, 4, 7, 2, 5, 8, 3, 6, 9];

        gridOrder.forEach(i => {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            const count = counts[i];
            
            if (count > 0) {
                let countClass = `count-${count}`;
                if (count >= 5) countClass = 'count-5-plus';
                cell.classList.add(countClass);
                cell.textContent = `${i} (${count})`;
            } else {
                cell.textContent = i;
                cell.style.opacity = '0.3';
            }
            numerologyGridEl.appendChild(cell);
        });
    }

    function renderMissingNumbers(counts) {
        const missing = Object.keys(counts).filter(num => counts[num] === 0);
        
        if (missing.length > 0) {
            missingNumbersSummaryEl.innerHTML = `<p>您的空缺數是：<strong>${missing.join(', ')}</strong></p>`;
            missingDetailsEl.innerHTML = missing.map(num => `
                <div class="missing-item">
                    <p>${missingNumberMeanings[num].replace(/\n/g, '<br>')}</p>
                </div>
            `).join('');
            missingDetailsEl.parentElement.classList.remove('hidden');
        } else {
            missingNumbersSummaryEl.innerHTML = '<p>恭喜！您的數字能量圈中沒有空缺數。</p>';
            missingDetailsEl.innerHTML = '';
            missingDetailsEl.parentElement.classList.add('hidden');
        }
    }

    function populateModal() {
        let htmlContent = '';

        const calcTitle = calculationMethod.match(/【(.*?)】/)[1];
        const calcDesc = calculationMethod.replace(/【.*?】\n/, '');
        const gridTitle = gridCalculationMethod.match(/【(.*?)】/)[1];
        const gridDesc = gridCalculationMethod.replace(/【.*?】\n/, '');

        htmlContent += `<h2>計算方式說明</h2>`;
        htmlContent += `<h3>${calcTitle}</h3>`;
        htmlContent += `<p>${calcDesc.replace(/\n/g, '<br>')}</p>`;
        htmlContent += `<h3>${gridTitle}</h3>`;
        htmlContent += `<p>${gridDesc.replace(/\n/g, '<br>')}</p>`;
        htmlContent += `<hr>`;

        htmlContent += `<h2>生命靈數 1-9 號人解析</h2>`;
        for (let i = 1; i <= 9; i++) {
            const fullText = lifePathMeanings[i];
            const title = fullText.match(/【(.*?)】/)[1];
            const description = fullText.replace(/【.*?】\n/, '');
            htmlContent += `<h3>${title}</h3><p>${description.replace(/\n/g, '<br>')}</p>`;
        }
        htmlContent += `<hr>`;

        htmlContent += `<h2>空缺數 1-9 意義</h2>`;
        for (let i = 1; i <= 9; i++) {
            const fullText = missingNumberMeanings[i];
            const title = fullText.match(/【(.*?)】/)[1];
            const description = fullText.replace(/【.*?】\n/, '');
            htmlContent += `<h3>${title}</h3><p>${description.replace(/\n/g, '<br>')}</p>`;
        }
        htmlContent += `<hr>`;

        htmlContent += `<h2>星座對應數字</h2>`;
        htmlContent += `<ul class="zodiac-list">`;
        for (const key in zodiacNumbers) {
            htmlContent += `<li><strong>${key} 號：</strong>${zodiacNumbers[key]}</li>`;
        }
        htmlContent += `</ul>`;
        
        // --- 新增：將連線說明也加入彈出視窗 ---
        htmlContent += `<hr>`;
        htmlContent += `<h2>九宮格連線意義</h2>`;
        for (const key in connectionLinesMeanings) {
            const line = connectionLinesMeanings[key];
            htmlContent += `<h3>${line.title}</h3><p>${line.description}</p>`;
        }

        sourceDataContentEl.innerHTML = htmlContent;
    }

    function openModal() {
        sourceModal.classList.remove('hidden');
    }

    function closeModal() {
        sourceModal.classList.add('hidden');
    }
    
    // Initialize
    populateModal();
});
