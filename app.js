let state = null;

function bodyLoad()
{
    getStatus((status) => 
    {
        if (status.status.indexOf("online") >= 0)
        {
            start();
            return;
        }
    });
}

function getStatus(callback)
{
    API_GET("",(data)=>{
        links(data);
        serverstatus(data);
        leaderboard(data);
        callback(data);
    });
}



function acceptContract(contractId)
{
    API_POST(`my/contracts/${contractId}/accept`,{/*contractId:contractId*/},(data)=>{
        if (data.error) 
        {
            if (data.error.code==4501) // already accepted... oups!!
            {
                API_GET("my/contracts",(data)=>{
                    dump(data);
                    state.contracts=data.data;
                    state.contract=state.contracts[0];
                    state.current.contractIndex=0;
                });
            }
        }
        else
        {
            var index = state.contracts.reduce((t,e,n)=>{
                console.log("search existing", data.data.contract.id,e.id,n);
                if (data.data.contract.id==e.id) 
                    return n;
                else
                    return t;
            },-1);
            if (index>=0) {
                if (data.data.contract)
                {
                    state.contracts[index] = data.data.contract;
                    state.contract = data.data.contract;
                    state.current.contractIndex = index;
                }
                else
                {
                    console.log(data.data.contract,data.data,data,state)
                }
            }
            else
            {
                state.contracts=[];
                state.contracts.push(data.contract);
                state.contract = data.contract;
                state.current.contractIndex = 0;
            }
        
        }
        keepState();
        redrawTabs();
    });
}

function goOrbit(shipname)
{
    API_POST(`my/ships/${shipname}/orbit`,null,(data)=>{
        var ndx = findShipIndex(shipname);
        state.fleet[ndx].nav = data.data;
        state.ship.nav = data.data;
        keepState();
        redrawTabs();
    })
}
function goDock(shipname)
{
    API_POST(`my/ships/${shipname}/dock`,null,(data)=>{
        var ndx = findShipIndex(shipname);
        state.fleet[ndx].nav = data.data;
        state.ship.nav = data.data;
        keepState();
        redrawTabs();
    })
}
function navigateShip(shipname,waypoint)
{
    console.log("navigate ",shipname," to ",waypoint);
    API_POST(`my/ships/${shipname}/navigate`,{waypointSymbol:waypoint},(data)=>{
        console.log(data.data);
        if (data.fuel) {state.ship.fuel = data.fuel; refreshFuel(state.ship.fuel);}
        if (data.nav)  {state.ship.nav = data.nav;   refreshNav(state.ship.nav);}
        state.fleet[findShipIndex(state.ship.symbol)] = state.ship;
        currentTab = 3;
        currentSection = 0;
        keepState();
        redrawTabs();
    })
}
function scanWaypoint(shipname,waypoint)
{
    API_POST(`my/ships/${shipname}/scan/waypoints`,null,(data)=>{
        //state.
        keepState();
        redrawTabs();
    })
}


function createSurvey(shipname)
{
    API_POST(`my/ships/${shipname}/survey`,null,(data)=>{
        //console.log(data)
        if (!state.surveys) state.surveys = [];
        state.surveys = state.surveys.concat(data.data.surveys);
        setCooling(shipname,data.data.cooldown.totalSeconds);
        keepState();
        redrawTabs();
    })
}
var lastSurvey;
function refreshCargo(shipname,surveydata)
{
    API_GET(`/my/ships/${shipname}/cargo`,(data)=>{
        state.ship.cargo = data.data;
        state.fleet[state.current.shipIndex] = state.ship;
        keepState();
        currentSection = 8;
        dropIrrelevantCargo(shipname);
        redrawTabs();
        //if (surveydata && state.ship.cargo.units < state.ship.cargo.capacity*.9)
          //  extractResource(shipname,surveydata);

    })
}

function extractResource(shipname,surveydata)
{
    lastSurvey = surveydata;
    API_POST(`my/ships/${shipname}/extract`,JSON.parse(unescape(surveydata)),(data)=>{
        setCooling(shipname,data.data.cooldown.totalSeconds,()=>{extractResource(shipname,surveydata)});
        refreshCargo(shipname,surveydata);
    })
}
var waste=[];
function dropIrrelevantCargo(shipname)
{
    waste = state.ship.cargo.inventory
                .filter(e=>!state.contract.terms.deliver.map(d=>d.tradeSymbol).includes(e.symbol))
                .map(e=>({symbol:e.symbol,units:e.units}));
    if (waste.length>0)
        setTimeout(()=>{
            var material = waste.shift();
            console.log("drop",material)
            if (material)
            {
                dropCargo(shipname,material.units,material.symbol);
                dropIrrelevantCargo(shipname);
            }
        },5000);
}
function dropCargo(shipname,unit,elementSymbol)
{
    API_POST(`my/ships/${shipname}/jettison`,{symbol:elementSymbol,units:unit},(data)=>{
        refreshCargo(shipname);
    });
}

function reviveCooldown()
{
    state.fleet.forEach(ship=> {
        console.log("check cooldown for ",ship.symbol);
        API_GET(`my/ships/${ship.symbol}/cooldown`,(data)=>{
            console.log(data.data);
            setCooling(ship.symbol,data.data.remainingSeconds);
        },(error)=>{
            if (error.error)
                console.log(error.error.message);
        })
    })
}

window.setInterval(tick,1000);
function now()
{
    return (new Date()).getTime();
}
function tick()
{
    Object.keys(cooling).forEach(shipSymbol=>{
        var delta = Math.floor(((cooling[shipSymbol].end - now()) / (cooling[shipSymbol].max*1000)) * cooling[shipSymbol].max) ;
        //console.log("tick",delta,shipSymbol,cooling[shipSymbol]);
        if (delta<0) delta = 0;
        var engineTemp = document.getElementById(`engineTemp${shipSymbol}`);
        engineTemp.innerHTML = `<div style="90vw;background-color:white;height:20px;">
        <div style="height:100%;background-color:red;width:${delta}%">${delta}</div>
        </div>`;

        })
}
var cooling = {};

function setCooling(shipSymbol,cooldown,restart)
{
    console.log("set cooling at ", cooldown);
    if (!cooling[shipSymbol]) cooling[shipSymbol] = {max:0,timer:null};
    cooling[shipSymbol].max = cooldown;
    cooling[shipSymbol].start = now();
    cooling[shipSymbol].end = now() + cooldown*1000;
    cooling[shipSymbol].timer = setTimeout(()=>showCoolDown(shipSymbol),cooldown * 1000);
    var engineTemp = document.getElementById(`engineTemp${shipSymbol}`);
    if (engineTemp==null) {
        engineTemp = document.createElement("div");
        engineTemp.id =`engineTemp${shipSymbol}`;
        document.getElementById("engineTemp").appendChild(engineTemp);
    }
    engineTemp.innerHTML = `<div style="90vw;background-color:white;height:20px;">
    <div style="height:100%;background-color:red;width:100%">${cooldown}</div>
    </div>`;

    function showCoolDown(shipSymbol)
    {
        var engineTemp = document.getElementById(`engineTemp${shipSymbol}`);
        engineTemp.innerHTML = "";
        //window.clearTimeOut(cooling[shipSymbol].timer);
        delete cooling[shipSymbol];
        if (restart) window.setTimeout(restart,1000);
    }
}

function cancelRestart(shipSymbol)
{
    if (cooling[shipSymbol])
    {
        window.clearTimeout(cooling[shipSymbol].timer);
        var engineTemp = document.getElementById(`engineTemp${shipSymbol}`);
        engineTemp.innerHTML = "";

    }
}



function d(date)
{
    return (new Date(date)).toLocaleDateString();
}
function dt(date)
{
    return (new Date(date)).toLocaleDateString() + " @ " + (new Date(date)).toLocaleTimeString();
}

function start()
{
    if (localStorage.getItem("SpaceTradersData")==null)
    {
        document.getElementById("registration").classList.add("notlogged");
        return;
    }
    state = JSON.parse(localStorage.getItem("SpaceTradersData"));
    if (!state.token) 
    {
        document.getElementById("registration").classList.add("notlogged");
        return;
    }

    document.getElementById("registration").classList.remove("notlogged");

    keepState();
    redrawTabs();
    reviveCooldown();
}
function keepState()
{
    localStorage.setItem("SpaceTradersData",JSON.stringify(state));
}
function redrawTabs()
{
    showTab();
    showTabContent(state);
}

function logout()
{
    localStorage.removeItem("SpaceTradersData",null);
    document.getElementById("registration").classList.remove("notlogged");
    var div = document.querySelector(".panel");
    div.innerHTML = `
<div class="tabs">
    <div class="tab-header">
    </div>
    <div class="tab-indicator"></div>
    <div class="tab-content">
    </div>
</div>
`;
    bodyLoad();
}




function dump(data) // for debugging
{
    let pre = document.getElementById("tempdata");
    if (pre){
        if (typeof(data)=="string")
            pre.innerHTML = data;
        else
        {
            if (typeof(data)=="object")
            {
                pre.innerHTML = JSON.stringify(data,null,2);
            }
        }
    }
}

function register()
{
    const body = {
        "faction":document.getElementById("faction").value,
        "symbol":document.getElementById("symbol").value,
        "email":document.getElementById("email").value
    };
    API_POST("register", body, data =>
    {
        console.log(data)
        if (data.error)
        {
            var span = document.getElementById("loginerror");
            switch(data.error.code)
            {
                case 4109:
                    span.innerHTML = "Agent symbol has already been claimed."
                    break;
                case 422:
                    span.innerHTML = Object.entries(data.error.data).map(([key,value])=>value).join("<br>");    
                    break;
                default:
                    span.innerHTML = Object.entries(data.error.data).map(([key,value])=>value).join("<br>");
            }
            dump(data);
        }
        else
        {
            state = stateFromRegister(data);
            localStorage.setItem("SpaceTradersData",JSON.stringify(state));
            API_GET(`systems/${state.ship.nav.systemSymbol}`,(data)=>{
                state.system = data.data;
                state.systems = [data.data];
                state.current.systemIndex = 0;
                keepState();
            });
            start();
            
        }
    });
}

function stateFromRegister(store)
{
    return {
        current: {
            contractIndex:0,
            factionIndex:0,
            shipIndex:0,
            systemIndex:0
        },
        agent:store.data.agent,
        contracts:[store.data.contract],
        contract:store.data.contract,
        factions:[store.data.faction],
        faction:store.data.faction,
        fleet:[store.data.ship],
        ship:store.data.ship,
        token:store.data.token
    };
}
