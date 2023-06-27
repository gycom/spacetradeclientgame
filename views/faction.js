function factionList(list)
{
    return list.map(listItem).join("");
    function listItem(item)
    {
        return `<div data-faction="${item.symbol}">${item.name} ${item.symbol}</div>`;
    }
}
function factionInfo(faction)
{
    return `
        <div>${faction.symbol} - ${faction.name}</div>
        <div><blockquote>${faction.description}</blockquote></div>
        <div>Headquarters: ${faction.headquarters}</div>
        <div>Trait:</div>
        <div class="traitlist">${traitList()}</div>
        <div><input type="checkbox" ${faction.isRecruiting?"checked":""} readonly=readonly name="recruiting"> is recruiting?</div>
`;
    function traitList()
    {
        return faction.traits.map(traitDetail).join(",&nbsp;");
        function traitDetail(e)
        {
            return `<span title="${e.description}">${e.name}</span>`;
        }
    }
}

function selectFaction()
{
    var ev = window.event;
    var target = ev.target;
    var selection = target.getAttribute("data-faction");
    if (selection!=null)
    {
        var ndx = findFactionIndex(selection);
        if (ndx>=0)
        {
            state.current.factionIndex = ndx;
            state.faction = state.factions[state.current.factionIndex];
            redrawTabs();
        }
    }

}
function findFactionIndex(sel)
{
    return (state.factions.map((e,n)=>({n:n,e:e})).filter(e=>e.e.symbol==sel)||[{n:-1}])[0].n;
}
function refreshFactionList()
{
    API_GET("factions",(response)=>{
        state.factions = response.data;
        if (state.factions.length>0)
        {
            API_GET(`factions/${state.factions[state.current.factionIndex].symbol}`,(response)=>{
                state.faction = response.data;
            });
        }
        redrawTabs();
    })
}
