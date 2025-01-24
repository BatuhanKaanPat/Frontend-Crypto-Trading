let playerCollection = loadDataFromStorage();


$(function() {
    drawAllProfiles();

    $(document).on("submit", "#createProfileForm", function(event) {
        event.preventDefault();

        let pname = $("#newProfileName").val();
        let countDay = 2;
        let pmoney = 1000.00;
        let pportfolio = [];

        let freshProfile = {
            name: pname,
            day: countDay,
            dollar: pmoney,
            coins: pportfolio
        };
        playerCollection.push(freshProfile);

        $("#createProfileOverlay").remove();
        drawProfile(freshProfile);
        saveAllProfiles();
    });

    $(document).on("click", "#triggerNewProfile", function() {
        $("body").prepend(addProfileOverlay);
        $("#newProfileName").focus();
    });

    $(document).on("click", ".btnDeleteProfile", function(e) {
        e.stopPropagation();
        let profName = $(this).parent().find("p").html();
        $(this).parent().remove();
        removeProfile(profName);
    });

    $(document).on("click", ".profileCard", function() {
        let profName = $(this).find("p").html();
        activeProfile = playerCollection.find(u => u.name === profName);
        drawProfileDay(activeProfile);
    });

    $(document).on("click", "#playerBar button", function() {
        saveAllProfiles();
        drawAllProfiles();
    });

    $(document).on("click", "#toggleTimeFlow", function() {
        let btn = $(this);

        if (sessionTimer) {
            clearInterval(sessionTimer);
            sessionTimer = null;
            btn.html(`<i class="fas fa-play"></i> Play`);
        } else {
            btn.html(`<i class="fas fa-pause"></i> Pause`);
            sessionTimer = setInterval(function() {
                if (activeProfile.day < 365) {
                    activeProfile.day += 1;
                    refreshDay(activeProfile);
                } else {
                    clearInterval(sessionTimer);
                    sessionTimer = null;
                }
            }, 100);
        }
    });

    $(document).on("click", "#advanceOneDay", function() {
        if (activeProfile.day < 365) {
            activeProfile.day += 1;
            refreshDay(activeProfile);
        }
    });

    $(document).on("mouseenter", ".chartBar", function() {
        const idx = $(this).data("index");
        const singleDay = coinData[idx];
        $("#chosenCurrency p").html(
            `Date: ${singleDay.date}, Open: $${singleDay.open}, Close: $${singleDay.close}, High: $${singleDay.high}, Low: $${singleDay.low}`
        );
    });
    $(document).on("mouseleave", ".chartBar", function() {
        $("#chosenCurrency p").html("");
    });

    $(document).on("click", "#marketCurrencies img", function() {
        let cCode = $(this).attr("id");
        drawProfileDay(activeProfile, cCode);
    });

    $(document).on("click", "#btnExecuteTrade", function() {
        let rawAmount = parseFloat($("#tradeQuantity").val());
        let priceNow = coinData[coinData.length - 1].close;
        let costDollars = rawAmount * priceNow;
        let existingCoin = activeProfile.coins.find(c => c.coin.code === currentCoin.code);

        if (tradeIsBuy) {
            if (costDollars <= activeProfile.dollar) {
                activeProfile.dollar -= costDollars;
                if (existingCoin) {
                    existingCoin.amount += rawAmount;
                } else {
                    activeProfile.coins.push({ coin: currentCoin, amount: rawAmount });
                }
                $("#tradeQuantity").val("");
                $("#tradeControl span").html(" = $");
            } else {
                // Not enough money
            }
        } else {
            if (existingCoin) {
                if (rawAmount <= existingCoin.amount) {
                    existingCoin.amount -= rawAmount;
                    activeProfile.dollar += costDollars;
                    $("#tradeQuantity").val("");
                    $("#tradeControl span").html(" = $");
                } else {
                    // Trying to sell more than owned
                }
            } else {
                // No coin to sell
            }
        }
        refreshDay(activeProfile);
    });
});


    $(document).on("click", "#btnBuy", function() {
        tradeIsBuy = true;
        $(this).addClass("selected-button");
        $("#btnSell").removeClass("selected-button")
                    .attr("style", "")
        $("#btnExecuteTrade").html(`Buy ${currentCoin.name.toUpperCase()}`)
        .attr("style", "")

    });



    $(document).on("click", "#btnSell", function() {
        tradeIsBuy = false;
        $(this).addClass("selected-button")
        .attr("style", "background-color:red!important;")

        $("#btnBuy").removeClass("selected-button");
        $("#btnExecuteTrade").html(`Sell ${currentCoin.name.toUpperCase()}`)
        .attr("style", "background-color:red!important;")

    });

    $(document).on("input", "#tradeQuantity", function() {
        let rawAmount = parseFloat($(this).val());
        let totalCost = rawAmount ? (rawAmount * coinData[coinData.length - 1].close).toPrecision(6) : "";
        $("#tradeControl span").html(totalCost ? ` = $${totalCost}` : " = $");
    });

    

function saveAllProfiles() {
    localStorage.setItem("playerCollection", JSON.stringify(playerCollection));
}
function loadDataFromStorage() {
    let data = localStorage.getItem("playerCollection");
    return data ? JSON.parse(data) : [];
}

function drawEmptyMsg() {
    $("#profileArea").html(`<p id="profileListEmpty">Empty</p>`);
}

function drawAllProfiles() {
    $("body").html("")
        .append(`
            <div id="outerContainer">
                <div id="headerRow">
                    <h1 id="appTitle"><b>CTIS</b> Crypto Trading Information System</h1>
                </div>
            </div>
        `);

    $("#profileArea").remove();
    $("#gameDashboard").remove();
    $("#playerBar").remove();

    $("#outerContainer").append(`<div id="profileArea"></div>`);

    if (playerCollection.length === 0) {
        drawEmptyMsg();
    } else {
        for (let oneProfile of playerCollection) {
            drawProfile(oneProfile);
        }
    }

    $("#profileArea").append(`
        <div id="triggerNewProfile">
            <button><i class="fas fa-plus"></i> New Profile</button>
        </div>
    `);
}

function drawProfile(profileObj) {
    $("#profileListEmpty").remove();
    $("#profileArea").append(`
        <div class="profileCard">
            <button class="btnDeleteProfile">
                <i class="fas fa-times"></i>
            </button>
            <i class="fas fa-user profile-icon"></i>
            <p>${profileObj.name}</p>
        </div>
    `);
}

function removeProfile(name) {
    playerCollection = playerCollection.filter(u => u.name !== name);
    saveAllProfiles();
    drawAllProfiles();
}

function updateDate(profileObj) {
    $("#gameTop h2").html(`Day ${profileObj.day}`);
    $("#gameTop p").html(`<b>${aDate(profileObj, market)}</b>`);
}

function drawProfileDay(profileObj, coinCode = 'btc') {
    saveAllProfiles();
    currentCoin = coins.filter(c => c.code === coinCode)[0];

    $("#profileArea").remove();
    $("#gameDashboard").remove();
    $("#playerBar").remove();

    $("#headerRow").append(`
        <div id="playerBar" >
            <p><i class="fas fa-user profile-icon"></i> ${profileObj.name}</p>
            <button type="button"><i class="fas fa-door-open"></i> Logout</button>
        </div>
    `);

    $("#outerContainer").append(`
        <div id="gameDashboard"></div>
    `);

    $("#gameDashboard").append(`
        <div id="gameTop">
            <h2>Day ${profileObj.day}</h2>
            <p><b>${aDate(profileObj, market)}</b></p>
            <button id="advanceOneDay"><i class="fas fa-forward"></i> Next Day</button>
            <button id="toggleTimeFlow"><i class="fas fa-play"></i> Play</button>
        </div>
    `);

    $("#gameDashboard").append(`
        <div id="marketSection">
            <div id="marketCurrencies">
                <img src="images/ada.png" id="ada">
                <img src="images/avax.png" id="avax">
                <img src="images/btc.png" id="btc">
                <img src="images/doge.png" id="doge">
                <img src="images/eth.png" id="eth">
                <img src="images/pol.png" id="pol">
                <img src="images/snx.png" id="snx">
                <img src="images/trx.png" id="trx">
                <img src="images/xrp.png" id="xrp">
            </div>
            <div id="chosenCurrency">
                <img src="images/${currentCoin.image}">
                <h4>${currentCoin.name}</h4>
                <p></p>
            </div>
            <div id="priceChart"></div>
        </div>
    `);
    CoinAnimation(currentCoin);

    $("#gameDashboard").append(`
        <h1 id="overallBalance">$<span></span></h1>
        <div id="tradeContainer"></div>
    `);

    refreshDay(profileObj);
}


function refreshDay(profileObj) {
    updateDate(profileObj);
    paint(currentCoin, profileObj);
    $("#tradeContainer").html("");

    $("#tradeContainer").append(`
        <div id="tradeControl">
            <h4>Trading</h4>
            <div>
                <button type="button" id="btnBuy" class="selected-button">Buy</button>
                <button type="button" id="btnSell">Sell</button>
            </div>
            <input type="text" id="tradeQuantity" placeholder="Amount"><span> = $</span>
            <button type="submit" id="btnExecuteTrade">Buy ${currentCoin.name.toUpperCase()}</button>
        </div>
    `).append(`
        <div id="walletContainer">
            <h4>Wallet</h4>
            <table id="walletTable">
                <tr id="walletHeader">
                    <th>Coin</th>
                    <th>Amount</th>
                    <th>Subtotal</th>
                    <th>Last Close</th>
                </tr>
                <tr id="walletCash">
                    <td>Dolar</td>
                    <td><b>$${profileObj.dollar.toPrecision(6)}</b></td>
                    <td></td>
                    <td></td>
                </tr>
            </table>
        </div>
    `);

    renderMoney(profileObj);
    finalizeDay(profileObj);
}

function aDate(profileObj, marketData) {
    if (profileObj.day > 0 && profileObj.day <= marketData.length) {
        const raw = marketData[profileObj.day - 1].date; 
        const [dayNum, monNum, yearNum] = raw.split('-');
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        return `${parseInt(dayNum)} ${months[parseInt(monNum) - 1]} ${yearNum}`;
    } else {
        return "Invalid day";
    }
}

function CoinAnimation(coinObj) {
    $(`#${coinObj.code}`).addClass("pulseEffect");
}
function removeCoinAnimation(coinObj) {
    $(`#${coinObj.code}`).removeClass("pulseEffect");
}

let activeProfile = null;

function paint(coinObj, profileObj) {
    $("#priceChart").html("");
    let cCode = coinObj.code;
    let limit = profileObj.day;

    coinData = fetchHistory(cCode, limit);

    const chartHeight = 200;
    const minVal = Math.min(...coinData.map(d => d.low));
    const maxVal = Math.max(...coinData.map(d => d.high));
    const valRange = maxVal - minVal;
    const scaleFactor = chartHeight / valRange;

    const latestClose = coinData[coinData.length - 1].close;
    const scaledClose = (latestClose - minVal) * scaleFactor + 10;

    $("#priceChart").append(`
        <div class="dottedLine" style="top:${chartHeight - scaledClose + 19}px;"></div>
        <div class="label closePrice" style="top:${chartHeight - scaledClose + 4}px;">
            $${latestClose.toPrecision(6)}
        </div>
    `);


    
    let xPos = -0.7;
    coinData.forEach((dayItem, idx) => {
        let oVal = dayItem.open;
        let cVal = dayItem.close;
        let minPt = dayItem.low;
        let maxPt = dayItem.high;

        let stickH = (maxPt - minPt) * scaleFactor;
        let barH = Math.abs(oVal - cVal) * scaleFactor;
        let barBottom = (Math.min(oVal, cVal) - minVal) * scaleFactor + 10;
        let stickBottom = (minPt - minVal) * scaleFactor + 10;
        let barColor = oVal < cVal ? "green" : "red";

        xPos += 100 / 120;

        $("#priceChart").append(`
            <div class='stick' style='height:${stickH}px; bottom:${stickBottom}px; left:${xPos + 0.18}%;'></div>
        `);
        $("#priceChart").append(`
            <div class='chartBar' style='background:${barColor}; bottom:${barBottom}px; left:${xPos - 0.1}%; 
                height:${barH}px; width:${100 / 180}%;' data-index="${idx}">
            </div>
        `);
    });

    $("#priceChart").append(`<div class="label maxLabel">$${maxVal.toPrecision(6)}</div>`);
    $("#priceChart").append(`<div class="label minLabel">$${minVal.toPrecision(6)}</div>`);
}

function finalizeDay(profileObj) {
    if (profileObj.day === 365) {
        $("#tradeControl").remove();
        $("#walletContainer").css("width", "100%");
        $("#overallBalance").addClass("pulseEffect");
    }
}

function fetchHistory(cCode, dayLimit) {
    let begin = 0;
    if (dayLimit > 121) {
        begin = dayLimit - 121;
    }
    return market
        .slice(begin, dayLimit - 1)
        .map(dayItem => {
            let cDetail = dayItem.coins.find(c => c.code === cCode);
            return {
                date: dayItem.date,
                open: cDetail.open,
                high: cDetail.high,
                low: cDetail.low,
                close: cDetail.close
            };
        });
}
let addProfileOverlay = `
    <div id="createProfileOverlay">
        <form action="" id="createProfileForm">
            <p><b>New Profile</b></p>
            <input type="text" name="new-profile-name" id="newProfileName" placeholder="Enter new profile..."><br>
            <button type="submit">Add</button>
        </form>
    </div>
`;
let sessionTimer = null;
let currentCoin = null;

let coinData = null;
let tradeIsBuy = true;

function renderMoney(profileObj) {
    let totalVal = profileObj.dollar;

    for (let coinLine of profileObj.coins) {
        let dayData = market[profileObj.day - 2];
        if (!dayData) continue;
        let singleCoin = dayData.coins.find(c => c.code === coinLine.coin.code);
        if (singleCoin) {
            let coinWorth = coinLine.amount * singleCoin.close;
            totalVal += coinWorth;
            $("#walletTable").append(`
                <tr>
                    <td>
                        <img src="images/${coinLine.coin.image}">
                        <span> ${coinLine.coin.name}</span>
                    </td>
                    <td>${coinLine.amount.toPrecision(6)}</td>
                    <td>${coinWorth.toPrecision(6)}</td>
                    <td>${singleCoin.close.toPrecision(6)}</td>
                </tr>
            `);
        }
    }

    $("#overallBalance span").html(totalVal.toFixed(2));
}

