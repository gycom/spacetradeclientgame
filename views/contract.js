function contractList(list)
{
    if (!list) return "";
    return list.map(listItem).join("");
    function listItem(item)
    {
        return `<div data-contract="${item.id}">${item.type} ${item.factionSymbol} ${item.terms.payment.onFulfilled} credits</div>`;
    }
}
function contractInfo(contract)
{
    if (!contract) return "";
    return `
    <div>Type: ${contract.type}</div>
    <div>Faction: ${contract.factionSymbol}</div>
    <br>
    ${contractTerm(contract.terms)}
    <br>
    <div>Deliver:</div>
    <div class="delivery-list">${goodList(contract.terms.deliver)}</div>
    <br>
    <div><input type="checkbox" ${contract.accepted?"checked":""} disabled name="accepted"> Accepted</div>
    <div><input type="checkbox" ${contract.fulfilled?"checked":""} disabled name="fulfilled"> Fulfilled</div>
    <br>
    <div>Expired on ${dt(contract.expiration)}</div>
    <div>Must accept before ${dt(contract.deadlineToAccept)}</div>
    <div>${contract.accepted?"":makeButton(contract.id)}</div>
`;
    function makeButton(id)
    {
        return `<button onclick="acceptContract('${id}')">Accept Contract</button>`
    }
    function contractTerm(terms)
    {
        return `
        <div>Deadline: ${dt(terms.deadline)}</div>
        <div>Payment on accepted: ${terms.payment.onAccepted} credits</div>
        <div>Payment on fulfilled: ${terms.payment.onFulfilled} credits</div>
    `;
    }
    function goodList(goods)
    {
        return  goods.map(goodItem).join("<br>");
        function goodItem(e)
        {
            var line = `
            ${e.tradeSymbol}: ${e.unitsFulfilled} / ${e.unitsRequired} units for ${e.destinationSymbol}
            `;
            if (state.ship.cargo.inventory.length>0)
            {
                state.ship.cargo.inventory.forEach(trade=>{
                    if (trade.symbol==e.tradeSymbol)
                        line += trade.units + " units in cargo"
                    if (state.ship.nav.waypointSymbol==e.destinationSymbol)
                    {
                        if (state.ship.nav.status!="DOCKED")
                        {
                            line += `<button onclick=\"goDock('${state.ship.symbol}')\">Dock</button>`;
                        }
                        else
                        {
                            line += `<button onclick=\"deliverContract('${state.ship.symbol}','${contract.id}','${trade.symbol}',${trade.units})\">Deliver</button>`;
                        }
                    }
                })
            }
            return line;
        }
    }
}

function selectContract()
{
    var ev = window.event;
    var target = ev.target;
    var selection = target.getAttribute("data-contract");
    if (selection!=null)
    {
        var ndx = findContractIndex(selection);
        if (ndx>=0)
        {
            state.current.contractIndex = ndx;
            state.contract = state.contracts[state.current.contractIndex];
            redrawTabs();
        }
    }

}
function findContractIndex(sel)
{
    return (state.contracts.map((e,n)=>({n:n,e:e})).filter(e=>e.e.id==sel)||[{n:-1}])[0].n;
}
function refreshContractList()
{
    API_GET("my/contracts",(response)=>{
        state.contracts = response.data;
        if (state.contracts.length>0)
        {
            API_GET(`my/contracts/${state.contracts[state.current.contractIndex].id}`
                ,(response)=>{state.contract = response.data})
        }
        redrawTabs();
    })
}
