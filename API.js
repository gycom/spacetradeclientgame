async function API_GET(query,callback,errorcb)
{
    let json;
    const options = {
        method:"GET",
        headers:{"Accept":"application/json"},
    };
    if (state && state.token) options.headers.Authorization = `Bearer ${state.token}`;
    var response;
    try
    {
        response = await fetch(`https://api.spacetraders.io/v2/${query}`,options);
    }
    catch(err) 
    {
        console.log(err);
        if (errorcb) errorcb({error:err.message});
    }
    var text = await response.text();
    if (text!="")
    {
        try
        {
            json = JSON.parse(text);
        } catch(err){
            console.log(err)
            if (errorcb) errorcb({error:err.message});
        }
        callback(json);
    }
    else
    {
        if (errorcb) errorcb({data:{}});
    }
}

async function API_POST(query,body,callback)
{
    let json;
    const options = {
        method:"POST",
        headers:{
            "Accept":"application/json",
            "Content-Type":"application/json",

        },
        body:body?JSON.stringify(body):undefined
    };
    if (state && state.token) options.headers.Authorization = `Bearer ${state.token}`;
    try
    {
        const response = await fetch(`https://api.spacetraders.io/v2/${query}`,options);
        json = await response.json();
    } 
    catch(err)
    {
        dump(err);
    }
    callback(json);
}
