var cc = DataStudioApp.createCommunityConnector();

var CLIENT_ID = 'APP-ID';
var CLIENT_SECRET = 'APP-SECRET'; 

var accessToken = "PAGE-TOKEN";


function getConfig() {
  var config = cc.getConfig();

  config.newInfo()
      .setId('instructions')
  .setText('Please enter the configuration data for your Facebook connector');

  config.newTextInput()
      .setId('page_id')
      .setName('Enter your Facebook Page Id')
      .setHelpText('Find the page Id on the \'About\' section of your page')  
      .setPlaceholder('Enter Facebook Page Id here')
      .setAllowOverride(false);
  
  config.setDateRangeRequired(true);

  return config.build();
}


function getConfig() {
  return {
    dateRangeRequired: true
  };
}

function getFields(request) {
  var cc = DataStudioApp.createCommunityConnector();
  var fields = cc.getFields();
  var types = cc.FieldType;

  fields.newMetric()
    .setId('page_fans')
    .setType(types.NUMBER)

  fields.newDimension()
    .setId('day')
    .setType(types.YEAR_MONTH_DAY);

  return fields;
}

function getSchema() {
  return {
    schema: [
      {
        name: 'page_fans',
        label: 'Like number',
        dataType: 'NUMBER',
        semantics: {
          conceptType: 'METRIC'
        }
      },
      {
        name: 'day',
        label: 'Day',
        dataType: 'STRING',
        semantics: {
          conceptType: 'DIMENSION',
          semanticGroup: 'DATETIME',
          semanticType: 'YEAR_MONTH_DAY'
        }
      }
    ]
  };
}

function getDataFromAPI(requestedMetric,startDate,endDate)
{
  var startDateMs = new Date(startDate).getTime() / 1000;
  var endDateMs = new Date(endDate).getTime() / 1000;
  var baseUrl = "https://graph.facebook.com/v6.0/580780118698601/insights?metric=";
  var custom_url = baseUrl + requestedMetric + "&period=day&since="+startDateMs +"&until="+endDateMs +"&access_token="+accessToken;

  return UrlFetchApp.fetch(custom_url);
}


function getData(request) {

  var startDate = request.dateRange.startDate;
  var endDate = request.dateRange.endDate;

  var dataSchema = [];
  var fixedSchema = getSchema().schema;
  request.fields.forEach(function(field) {
    for (var i = 0; i < fixedSchema.length; i++) {
      if (fixedSchema[i].name == field.name) {
        dataSchema.push(fixedSchema[i]);
        break;
      }
    }
  });

  var metrics = ['page_fans'];
  //var metrics = ['page_fans','page_fans_paid','page_impressions','page_impressions_paid','page_fans_country','page_fans_gender_age','page_fan_adds'];

  var response = getDataFromAPI(metrics[0],startDate,endDate);

  /*
  for each(var elem in metrics)
  {
    var response = getDataFromAPI(elem,startDate,endDate);
    totalResponse.push(response);
  }


  listOfParsedResponse = [];

  for each(var elem in totalResponse)
  {
    var parsedResponse = JSON.parse(elem).data[0].values;
    listOfParsedResponse.push(parsedResponse);
  }



  for (var i = 0; i < listOfParsedResponse[0].length; i++) {
      //parsedResponse1[i].concat({"impression":parsedResponse2[i].value});
      for each(var metricID = 0; i < metrics.length; i++)
      {
        listOfParsedResponse[0][i][metrics[metricID]]=listOfParsedResponse[metricID].value;
      }
    }
  */

  var parsedResponse = JSON.parse(response).data[0].values;

  var data = [];
  parsedResponse.forEach(function(fans) {
    var values = [];

    var fansTime = new Date(fans.end_time);
    // Google expects YYMMDD format
    var fansDate = fansTime.toISOString().slice(0, 10).replace(/-/g, "");

    // Provide values in the order defined by the schema.
    dataSchema.forEach(function(field) {
      switch (field.name) {
      case 'page_fans':
        values.push(fans.value);
        break;
      case 'day':
        // Google expects YYYYMMDD format
        values.push(fansDate);
        break;
      }
    });
    data.push({
      values: values
    });
  });

  return {
    schema: dataSchema,
    rows: data
  };

}


// Use for debug only, allow us to see the error code in data studio when somethhing is wrong.
function isAdminUser(){
 var email = Session.getEffectiveUser().getEmail();
  if( email == 'steven@itsnotthatkind.org' || email == 'analyticsintk@gmail.com' || email == 'quentin@itsnotthatkind.org'){
    return true; 
  } else {
    return false;
  }
}

/**** BEGIN: OAuth Methods ****/

function getAuthType() {
  var response = { type: 'OAUTH2' };
  return response;
}

function resetAuth() {
  getOAuthService().reset();
}

function isAuthValid() {
  return getOAuthService().hasAccess();
}

function getOAuthService() {
  return OAuth2.createService('exampleService')
    .setAuthorizationBaseUrl('https://www.facebook.com/dialog/oauth')
    .setTokenUrl('https://graph.facebook.com/v5.0/oauth/access_token')      
    .setClientId(CLIENT_ID)
    .setClientSecret(CLIENT_SECRET)
    .setPropertyStore(PropertiesService.getUserProperties())
    .setCallbackFunction('authCallback')
    .setScope('pages_show_list, manage_pages, read_insights');
};

function authCallback(request) {
  var authorized = getOAuthService().handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab');
  };
};

function get3PAuthorizationUrls() {
  return getOAuthService().getAuthorizationUrl();
}

/**** END: OAuth Methods ****/
