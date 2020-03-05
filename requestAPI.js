



function getDataFromAPI(requestedMetric,startDate,endDate,pageToken)
{
  var startDateMs = new Date(startDate).getTime() / 1000;
  var endDateMs = new Date(endDate).getTime() / 1000;
  var baseUrl = "https://graph.facebook.com/v6.0/580780118698601/insights?metric=";
  var custom_url = baseUrl + requestedMetric + "&period=day&since="+startDateMs +"&until="+endDateMs +"&access_token="+pageToken;

  return UrlFetchApp.fetch(custom_url);
}




function getListOfMetrics(requestedMetrics,startDate,endDate,pageToken) {
  var allMetrics = [];
  requestedMetrics.forEach((item, i) => {
    var response = getDataFromAPI(item,startDate,endDate,pageToken)
    var parsedResponse = JSON.parse(response).data[0];
    allMetrics.push(parsedResponse);
  });

  return allMetrics;

}
