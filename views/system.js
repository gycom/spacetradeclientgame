function systemList(list) {
    if (!list) return "";
    return list.map(listItem).join("");
    function listItem(item) {
        return `<div data-system="${item.symbol}">${item.symbol} ${item.type}<br>dist: ${calcDist(item.x, item.y)}</div>`;
    }
}
function systemInfo(system) {
    if (!system) return "";
    return `
    <div>${system.symbol}</div>
    <div>sector: ${system.sectorSymbol}</div>
    <div>type: ${system.type}</div>
    <div>coord: ${system.x} ${system.y}</div>
    ${systemButton()}
    <br>
    <p><table>${system.waypoints.map(waypointInfo).join("")}</table></p>
    `;
}
function systemButton()
{
    var list = "";
    if (state.ship.nav.status=="IN_ORBIT")
        list += `<button onclick="scanWaypoints('${state.ship.symbol}')">Scan waypoints</button>`;
    return list;
}
function waypointInfo(wp)
{
    return `<tr data-waypoint="${wp.symbol}" style="width:100%">
    <td>${wp.symbol}</td><td title='${listTraits(wp)}'>${wp.type}</td><td>coord: ${wp.x} ${wp.y}</td><td>${makeNavigateButton()}</td>
    </tr>
    `;
    function makeNavigateButton()
    {
        var buttonList = "";
        if (wp.symbol==state.ship.nav.waypointSymbol)
        { 
            if (state.ship.nav.status == "IN_ORBIT" && wp.type=="ASTEROID_FIELD")
            {
                var ndx = findSurveySymbolIndex(wp.symbol);
                if (ndx>=0)
                {
                    buttonList += `<button onclick="extractResource('${state.ship.symbol}','${escape(JSON.stringify(state.surveys.filter(e=>e.symbol==wp.symbol)[0]))}')">Extraction</button>`;
                }
                else
                {
                    buttonList += `<button onclick="createSurvey('${state.ship.symbol}')">Survey here</button>`;
                }
            }
            if (state.ship.nav.status == "DOCKED")
            {
                buttonList += `<button onclick="goOrbit('${state.ship.symbol}')">Go Orbit</button>`;
            }
        }else
        {

            if (state.ship.nav.status != "DOCKED")
            {
                buttonList += `<button onclick="navigateShip('${state.ship.symbol}','${wp.symbol}')">Navigate</button>`;
            } 
        }
        return buttonList;
    }
}

function selectSystem()
{
    var ev = window.event;
    var target = ev.target;
    var selection = target.getAttribute("data-system");
    if (selection!=null)
    {
        var ndx = findSystemIndex(selection);
        if (ndx>=0)
        {
            state.current.systemIndex = ndx;
            state.system = state.systems[state.current.systemIndex];
            redrawTabs();
        }
    }
}
function findSystemIndex(sel)
{
    return ((state.systems.map((e,n)=>({n:n,e:e})).filter(e=>e.e.symbol==sel))[0]||{n:-1}).n;
}

function refreshSystemList()
{
    API_GET("systems",(response)=>{
        state.systems = response.data;
        API_GET(`systems/${state.ship.nav.systemSymbol}`,(response)=>{
            state.system = response.data;
        })
        redrawTabs();
    })
}
function calcDist(x,y)
{
    var ndx = findSystemIndex(state.ship.nav.systemSymbol);
    if (ndx<0) return 0;
    var here = state.systems[ndx];
    return Math.round(100*Math.sqrt((here.x - x)*(here.x - x) + (here.y - y)*(here.y - y)))/100;
}

function listTraits(wp)
{
    if (wp.traits && wp.traits.length>0)
    {
        return wp.traits.map(t=>t.symbol).join(", ");
    }
    return "";
}