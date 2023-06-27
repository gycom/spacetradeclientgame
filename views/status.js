function serverstatus(response)
{
    var div=document.getElementById("serverstatus");
    div.innerHTML = 
    `
        <p>
        ${response.version}: 
        ${response.status}
        </p>
        <p><i>Last Reset: ${d(response.resetDate)}</i></p>
        <p><i>Next Reset: ${dt(response.serverResets.next)}</i></p>
        <p>${response.description}</p>
        <p><i>${JSON.stringify(response.stats)}</i></p>
    `;
    nextReset = response.serverResets.next;
}

function links(data)
{
    var linkFilter = e => ["Website","Documentation","API Reference","Discord","Twitter"].includes(e.name);
    var links = document.querySelector("#links");
    links.innerHTML = data.links
                        .filter(linkFilter)
                        .map(renderLink)
                        .join("");
    function renderLink(e)
    {
        return `<li><a target="_blank" href='${e.url}'>${e.name}</a></li>`
    }
}
