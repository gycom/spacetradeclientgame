function marketList(list)
{
    if (!list) return "";
    return list.map(listItem).join("");
    function listItem(item)
    {
        return `<div data-market="${item.symbol}">${item.symbol}}</div>`;
    }
}

function marketInfo(market)
{
    if (!market) return "";
    return `
    <span style='font-size:20px;'>${market.symbol}</span>
    ${goodList('IMPORTS',market.imports)}
    ${goodList('EXPORTS',market.exports)}
    ${goodList('EXCHANGE',market.exchange)}
    `;
}

function goodList(title,list)
{
    if (!list) return "";
    return `<div>${title}</div><div style='margin-left:20px;margin-bottom:10px;'>`+ list.map(goodDetail).join("") + "</div>";
    function goodDetail(item)
    {
        return `<table>
        <tr>
            <td width='200px'>${item.symbol}</td><td rowspan=2>${item.description}</td>
        </tr>
        <tr><td>
        ${item.name}
        </td></tr>
        </table>
        <br>
        `;
    }
}

function selectMarket()
{
    var ev = window.event;
    var target = ev.target;
    var selection = target.getAttribute("data-market");
    if (selection!=null)
    {
        var ndx = findMarketIndex(selection);
        if (ndx>=0)
        {
            state.current.marketIndex = ndx;
            state.market = state.markets[state.current.marketIndex];
            redrawTabs();
        }
    }
}
