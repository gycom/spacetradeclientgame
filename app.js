let state = null;
let agents = [];
let nextReset = null;
function bodyLoad()
{
    try {document.getElementById("login").focus();} catch(err){} // ready to login
    getStatus((response)=>{
        links(response);
        serverstatus(response);
        leaderboard(response);
        buildAgentCombo();
    })
}

function getStatus(callback,callerror)
{
    // API: Get Status
    API_GET("",(response)=>{
        links(response);
        serverstatus(response);
        leaderboard(response);
        callback(response);
    },(response)=>{
        callerror(response); // token must be expired
    });
}



function acceptContract(contractId)
{
    API_POST(`my/contracts/${contractId}/accept`,{/*contractId:contractId*/},(response)=>{
        if (response.error) 
        {
            if (response.error.code==4501) // already accepted... oups!!
            {
                API_GET("my/contracts",(response)=>{
                    dump(response);
                    state.contracts=response.data;
                    state.contract=state.contracts[0];
                    state.current.contractIndex=0;
                });
            }
        }
        else
        {
            var index = state.contracts.reduce((t,e,n)=>{
                //console.log("search existing", response.data.contract.id,e.id,n);
                if (response.data.contract.id==e.id) 
                    return n;
                else
                    return t;
            },-1);
            if (index>=0) {
                if (response.data.contract)
                {
                    state.contracts[index] = response.data.contract;
                    state.contract = response.data.contract;
                    state.current.contractIndex = index;
                }
                else
                {
                    //console.log(response.data.contract,response.data,data,state)
                }
            }
            else
            {
                state.contracts=[];
                state.contracts.push(response.contract);
                state.contract = response.contract;
                state.current.contractIndex = 0;
            }
        
        }
        keepState();
        redrawTabs();
    });
}

function goOrbit(shipname)
{
    API_POST(`my/ships/${shipname}/orbit`,null,(response)=>{
        var ndx = findShipIndex(shipname);
        state.fleet[ndx].nav = response.data.nav;
        state.ship.nav = response.data.nav;
        keepState();
        redrawTabs();
    })
}
function goDock(shipname)
{
    API_POST(`my/ships/${shipname}/dock`,null,(response)=>{
        var ndx = findShipIndex(shipname);
        state.fleet[ndx].nav = response.data.nav;
        state.ship.nav = response.data.nav;
        keepState();
        redrawTabs();
    })
}
function navigateShip(shipname,waypoint)
{
    API_POST(`my/ships/${shipname}/navigate`,{waypointSymbol:waypoint},(response)=>{
        if (response.data.fuel) {state.ship.fuel = response.data.fuel;}
        if (response.data.nav)  {state.ship.nav = response.data.nav;}
        state.fleet[findShipIndex(state.ship.symbol)] = state.ship;
        currentTab = 3;
        currentSection = 0;
        keepState();
        redrawTabs();
    })
}
function scanWaypoints(shipname)
{
    API_POST(`my/ships/${shipname}/scan/waypoints`,null,(response)=>{
        var ndx = findSystemIndex(state.system.symbol);
        state.system.waypoints = response.data.waypoints;
        if (ndx>=0) state.systems[ndx].waypoints = response.data.waypoints;
        response.data.waypoints.forEach((wp)=>{
            console.log(wp)
            if (waypointHas(wp.symbol,"MARKETPLACE"))
            {
                console.log("found market",wp)
                addMarket(state.system.symbol,wp.symbol);
            }
        });
        setCooling(shipname,response.data.cooldown.totalSeconds);
        keepState();
        redrawTabs();
    })
}


function createSurvey(shipname)
{
    API_POST(`my/ships/${shipname}/survey`,null,(response)=>{
        if (!state.surveys) state.surveys = [];
        state.surveys = state.surveys.concat(response.data.surveys);
        setCooling(shipname,response.data.cooldown.totalSeconds);
        keepState();
        redrawTabs();
    })
}
var lastSurvey;
function refreshCargo(shipname,surveydata)
{
    API_GET(`/my/ships/${shipname}/cargo`,(response)=>{
        state.ship.cargo = response.data;
        state.fleet[state.current.shipIndex] = state.ship;
        keepState();
        currentSection = 8;
        //dropIrrelevantCargo(shipname);
        redrawTabs();
    })
}

function extractResource(shipname,surveydata)
{
    lastSurvey = surveydata;
    API_POST(`my/ships/${shipname}/extract`,JSON.parse(unescape(surveydata)),(response)=>{
        if (response.data)
            setCooling(shipname,response.data.cooldown.totalSeconds,()=>{extractResource(shipname,surveydata)});
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
            if (material)
            {
                dropCargo(shipname,material.units,material.symbol);
                dropIrrelevantCargo(shipname);
            }
        },5000);
}
function dropCargo(shipname,unit,elementSymbol)
{
    API_POST(`my/ships/${shipname}/jettison`,{
        symbol:elementSymbol,
        units:unit
    },() => {
        refreshCargo(shipname);
    });
}

function reviveCooldown()
{
    state.fleet.forEach(ship=> {
        console.log("check cooldown for ",ship.symbol);
        API_GET(`my/ships/${ship.symbol}/cooldown`
        ,(response)=>{
            setCooling(ship.symbol,response.data.remainingSeconds);
        },(response)=>{ // failure
            if (response.error)
                console.log(response.error.message);
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
        var percent = Math.floor(((cooling[shipSymbol].end - now()) / (cooling[shipSymbol].max*1000)) * cooling[shipSymbol].max);
        if (percent < 0) percent = 0;
        var engineTemp = document.getElementById(`engineTemp${shipSymbol}`);
        engineTemp.innerHTML = progressBar(percent);
    });
        
    if (state.markets && state.markets.length>0)
    {
        state.markets.filter(m=>m.imports.length+m.exports.length+m.exchange.length==0).forEach((m,n)=>{
            if (n>1) return;
            console.log("reading",m,n)
            window.setTimeout(()=>readMarket(m.systemSymbol,m.symbol),n*1000);
        })
    }
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
    engineTemp.innerHTML = progressBar(100); // start at 100%

    function showCoolDown(shipSymbol)
    {
        var engineTemp = document.getElementById(`engineTemp${shipSymbol}`);
        engineTemp.innerHTML = "";
        delete cooling[shipSymbol];
        if (restart) window.setTimeout(restart,1000);
    }
}
function progressBar(delta)
{
    return `
    <div style="90vw;background-color:white;height:20px;">
        <div style="height:100%;background-color:red;width:${delta}%">${delta}</div>
    </div>`;
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
    document.getElementById("registration").classList.add("notlogged");
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




function dump(objectvalue) // for debugging
{
    let pre = document.getElementById("tempdata");
    if (pre){
        if (typeof(objectvalue)=="string")
            pre.innerHTML = objectvalue;
        else
        {
            if (typeof(objectvalue)=="object")
            {
                pre.innerHTML = JSON.stringify(objectvalue,null,2);
            }
        }
    }
}

function register()
{
    if (state && state.token) delete state.token;
    const body = {
        faction:document.getElementById("faction").value,
        symbol: document.getElementById("symbol").value,
        email:  document.getElementById("email").value
    };
    API_POST("register", body, response =>
    {
        console.log(response)
        if (response.error)
        {
            var span = document.getElementById("loginerror");
            switch(response.error.code)
            {
                case 4109:
                    span.innerHTML = "Agent symbol has already been claimed."
                    break;
                case 422:
                    span.innerHTML = Object.entries(response.error.data).map(([key,value])=>value).join("<br>");    
                    break;
                default:
                    span.innerHTML = Object.entries(response.error.data).map(([key,value])=>value).join("<br>");
            }
            dump(response);
        }
        else
        {
            state = stateFromRegister(response);
            localStorage.setItem("SpaceTradersData",JSON.stringify(state));
            pushAgent();
            keepAgents();
            API_GET(`systems/${state.ship.nav.systemSymbol}`,(response)=>{
                state.system = response.data;
                state.systems = [response.data];
                state.current.systemIndex = 0;
                keepState();
            });
            start();
            
        }
    });
}
function stateFromRegister(response)
{
    const state = {
        agent:      response.data.agent,
        contracts:  [response.data.contract],
        contract:   response.data.contract,
        factions:   [response.data.faction],
        faction:    response.data.faction,
        fleet:      [response.data.ship],
        ship:       response.data.ship,
        token:      response.data.token,
        current: {
            contractIndex:  0,
            factionIndex:   0,
            shipIndex:      0,
            systemIndex:    0,
            surveyIndex:    0,
            marketIndex:    0
        }
    };
    return state;
}

function keepAgents()
{
    localStorage.setItem("SpaceTradersAgents",JSON.stringify(agents));
}
function pushAgent()
{
    agents = agents.map(agent=>({...agent,currentAgent:false}));
    agents.push({
        agent:          state.agent,
        token:          state.token,
        creation:       new Date(),
        currentAgent:   true,
        nextReset:      nextReset || (new Date()).toLocaleString()
    });
}
function loadAgents()
{
    if (localStorage.getItem("SpaceTradersAgents")!=null)
        agents = JSON.parse(localStorage.getItem("SpaceTradersAgents"));
    else
        agents = [];
}
function buildAgentCombo()
{
    const newOption = (value,text,def) => {
        var opt = document.createElement("OPTION");
        opt.text = text;
        opt.value = value;
        if (value == def) opt.selected = true;
        return opt;
    };
    loadAgents();
    var def = (agents.filter(e=>e.currentAgent)[0]||{agent:{symbol:""}}).agent.symbol;
    var cbo = document.getElementById("agentlist");
    cbo.options.add(newOption("","-- new agent --"));
    agents.forEach((agent)=>cbo.options.add(newOption(agent.agent.symbol,agent.agent.symbol,def)));
    selectAgent();
}

function selectAgent()
{
    var selectedValue = document.getElementById("agentlist").value;
    document.getElementById("loginform").className = selectedValue != "" ? "oldagent" : "newagent";
    if (selectedValue=="") return;
    state = {token:agents.filter(e=>e.agent.symbol==selectedValue)[0].token};
    var loginButton = document.getElementById("login");
    getStatus(success,failure);
    function success(response)
    {
        loginButton.disabled = false;
        document.getElementById("loginerror").innerHTML = "";
    }
    function failure(response)
    {
        console.log("failure",response.error.message);
        loginButton.disabled = true;
        document.getElementById("loginerror").innerHTML = response.error.message;
    }
}

function doLogin()
{
    const success = (response) => 
    {
        if (response.status.indexOf("online") >= 0)
        {
            start();
            return;
        }
    };
    const failure = (response)=>{
        console.log("STATUS ERROR",response)
    };
    getStatus(success,failure);
}

function deliverContract(shipSymbol,contractId,tradeSymbol,units)
{
    API_POST(`my/contracts/${contractId}/deliver`,{
        shipSymbol:shipSymbol,tradeSymbol:tradeSymbol,units:units
    },(response)=>{
        var ndx = findContractIndex(contractId);
        if (ndx>=0) state.contracts[ndx] = response.data.contract;
        var ndxShip = findShipIndex(shipSymbol);
        if (ndxShip>=0) state.fleet[ndxShip].cargo = response.data.cargo;
        keepState();
        redrawTabs();
    });
}

function sellCargo(shipSymbol,units,tradeSymbol)
{
    API_POST(`my/ships/${shipSymbol}/sell`,{
        symbol:tradeSymbol,
        units:units
    },(response)=>{
        if(response.data)
        {
            state.agent = response.data.agent;
            state.ship.cargo = response.data.cargo;
            console.log(response.data.transaction);
        }
        keepState();
        redrawTabs();
    });
}

function waypointHas(waypointSymbol,trait)
{
    var wp = findWaypoint(waypointSymbol);
    console.log(wp);
    if (wp && wp.traits && wp.traits.length>0)
    {
        return wp.traits.filter(w=>w.symbol==trait).length>0;
    }
    return false;
}

function doesMarketBuy(waypointSymbol,tradeSymbol)
{
    return true;
}

function findWaypoint(waypointSymbol)
{
    var found;
    state.system.waypoints.forEach(wp=>{
        if (wp.symbol == waypointSymbol)
            found = wp;
    });
    return found;
}

function readMarket(systemSymbol,waypointSymbol)
{
    API_GET(`systems/${systemSymbol}/waypoints/${waypointSymbol}/market`,(response)=>{
        var ndx = findMarketIndex(waypointSymbol);
        
        if (ndx>=0) 
        {
            state.markets[ndx]=response.data;
            keepState();
            redrawTabs();
        }
    })
}

function addMarket(systemSymbol,waypointSymbol)
{
    if (!state.markets) state.markets = [];
    var ndx = findMarketIndex(waypointSymbol);
    if (ndx==-1)
    {
        state.markets.push({
            symbol:waypointSymbol,
            systemSymbol:systemSymbol,
            exports:[],
            imports:[],
            exchange:[]
        });
        keepState();
        redrawTabs();
    }
}

function findMarketIndex(sel)
{
    return ((state.markets.map((e,n)=>({n:n,e:e})).filter(e=>e.e.symbol==sel))[0]||{n:-1}).n;
}
