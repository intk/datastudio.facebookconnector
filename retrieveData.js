function retrieveGender(data,day) {
  var female =0;
  var male=0;
  var unknown=0;

  for (var [key, value] of Object.entries(data)) {
    if (key.indexOf("U")>-1) {
      unknown+=value
    }
    else if (key.indexOf("M")>-1) {
      male+=value
    }
    else if (key.indexOf("F")>-1) {
      female+=value
    }
  }


  console.log("Male :",male);
  console.log("Female :",female);
  console.log("Unkown :",unknown);

  day['male_gender']=male;
  day['female_gender']=female;
  day['unknown_gender']=unknown;

}


function getPostFromAPI(startDate,endDate,pageToken,requestEndpoint) {
  //remove last "/"
  requestEndpoint = requestEndpoint.substring(0, requestEndpoint.length - 1);
  var url = requestEndpoint + "?fields=published_posts.since("+startDate+").until("+endDate+").limit(100)&access_token=";

  //url+=pageToken;
  //var accessToken = "EAACyGl23lPIBAHEQ8XISMnFiunlpVbpgKjg1xc1qCRcuZCFwpZBjLkvyFCYUOepFXLkZAnIFYTjS6VCU0sbk2SSQxi7ziYGO2PwU2NIYgdz8k65SV1RRBDM7qmmvZCNGmSat2sZCI2i4lHkjd1lW0eopZAUsfVMexxtFbcvS1XqgZDZD";
  url+=pageToken;

  console.log("Get Posts : ",url);


  var apiresponse = JSON.parse(UrlFetchApp.fetch(url));

  // organise in days
  var days = [];

  apiresponse.published_posts.data.forEach(function(field) {
    var newDay = {};

    var date = new Date(field.created_time); //.toISOString().slice(0, 10).replace(/-/g, "");

    //Adjust date to be as on Facebook Insight
    date.setDate(date.getDate());

    // Google expects YYYYMMDD format
    newDay.post_date = date.toISOString().slice(0, 10).replace(/-/g, "");
    newDay.post_message = field.message


    if (newDay.post_message != null)
    {
    //Extract the ID of the post.
    //262367372678_10158165083332679 should be split in 262367372678 and 10158165083332679
    var indexSplit = field.id.indexOf("_");
    var pageID = field.id.substring(0,indexSplit);
    var postID = field.id.substring(indexSplit+1,field.id.length);

    var postLink = "https://www.facebook.com/"+pageID+"/posts/"+postID
    newDay.post_link = postLink;

    //for each post make a request to have engagement and post_impressions
    var url = "https://graph.facebook.com/v5.0/"+field.id+"/insights?metric=post_engagements,post_impressions&access_token="+accessToken;

    var insightsResponse = JSON.parse(UrlFetchApp.fetch(url));
    newDay.post_engagements = insightsResponse.data[0].values[0].value;
    newDay.post_impressions = insightsResponse.data[1].values[0].value;

    days.push(newDay);
    }
  });

  return days;
}


function getPostNumber(startDate,endDate,pageToken,requestEndpoint) {
    //remove last "/"
  requestEndpoint = requestEndpoint.substring(0, requestEndpoint.length - 1);

  //Start date -1
  var startDateOffset = new Date(startDate);
  startDateOffset.setDate(startDateOffset.getDate()-1);
  startDateOffset = formatDate(startDateOffset);

  //Start date +1
  var endDateOffset = new Date(endDate);
  endDateOffset.setDate(endDateOffset.getDate()+1);
  endDateOffset = formatDate(endDateOffset);

  var url = requestEndpoint + "?fields=published_posts.since("+startDateOffset+").until("+endDateOffset+").limit(50)&access_token=";

  //url+=pageToken;
  //var accessToken = "EAACyGl23lPIBAHEQ8XISMnFiunlpVbpgKjg1xc1qCRcuZCFwpZBjLkvyFCYUOepFXLkZAnIFYTjS6VCU0sbk2SSQxi7ziYGO2PwU2NIYgdz8k65SV1RRBDM7qmmvZCNGmSat2sZCI2i4lHkjd1lW0eopZAUsfVMexxtFbcvS1XqgZDZD";
  url+=pageToken;

  console.log("Get Posts Number: ",url);
  var apiresponse = JSON.parse(UrlFetchApp.fetch(url));

  //var postNumber = apiresponse.published_posts.data.length;
  var postNumber = 0
  apiresponse.published_posts.data.forEach(function(field) {
    if (field.message != undefined)
    {
      postNumber+=1;
    }
  });

  var newDay = {};
  newDay.post_number = postNumber;
  return [newDay,newDay,newDay];
}


function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}
