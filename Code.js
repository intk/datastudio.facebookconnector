var cc = DataStudioApp.createCommunityConnector();

function getConfig() {
  var config = cc.getConfig();

  config.newInfo()
   .setId('instructions')
  .setText('Please enter the configuration data for your Facebook connector');

  config.newTextInput()
      .setId('page_id')
      .setName('Enter your Facebook Page Id')
      .setHelpText('Find the page Id on the \'About\' section of your page')
      .setPlaceholder('Enter your Facebook Page Id')
      .setAllowOverride(false);

  config.setDateRangeRequired(true);

  return config.build();
}

function getFields(request) {
  var cc = DataStudioApp.createCommunityConnector();
  var fields = cc.getFields();
  var types = cc.FieldType;

  fields.newMetric()
    .setId('page_fan_adds')
    .setType(types.NUMBER)
    .setName('New Page likes')
  fields.newMetric()
    .setId('page_views_total')
    .setType(types.NUMBER)
    .setName('Page view')
  fields.newMetric()
    .setId('page_fans')
    .setType(types.NUMBER)
    .setName('Pages likes')
  fields.newMetric()
      .setId('page_posts_impressions')
      .setType(types.NUMBER)
      .setName('Pages Post Impressions')
  fields.newMetric()
      .setId('page_post_engagements')
      .setType(types.NUMBER)
      .setName('Pages Post Engagements')
  fields.newMetric()
      .setId('page_posts_impressions_organic')
      .setType(types.NUMBER)
      .setName('New Page likes')
  fields.newMetric()
      .setId('page_posts_impressions_paid')
      .setType(types.NUMBER)
      .setName('Pages Post Impressions Organic')
  fields.newMetric()
      .setId('post_number')
      .setType(types.NUMBER)
      .setName('Number of posts')
  fields.newMetric()
      .setId('male_gender')
      .setType(types.NUMBER)
      .setName('Male')
  fields.newMetric()
      .setId('female_gender')
      .setType(types.NUMBER)
      .setName('Female')
  fields.newMetric()
      .setId('unknown_gender')
      .setType(types.NUMBER)
      .setName('Unknown gender')
  fields.newMetric()
      .setId('post_impressions')
      .setType(types.NUMBER)
      .setName('Post Impressions')
  fields.newMetric()
      .setId('post_engagements')
      .setType(types.NUMBER)
      .setName('Post Engagements')
  fields.newDimension()
      .setId('day')
      .setType(types.YEAR_MONTH_DAY)
      .setName('Day')
  fields.newDimension()
      .setId('post_date')
      .setType(types.YEAR_MONTH_DAY)
      .setName('Post Date')
  fields.newDimension()
      .setId('post_link')
      .setType(types.URL)
      .setName('Post Link')
  fields.newDimension()
      .setId('post_message')
      .setType(types.TEXT)
      .setName('Post Message')
  fields.newDimension()
      .setId('post_hyperlink')
      .setName('Post Hyperlink')
      .setType(types.HYPERLINK)
      .setFormula('HYPERLINK($post_link,$post_message)');

  return fields;
}

function getSchema(request) {
    var fields = getFields().build();
    return { 'schema': fields };
}

function getToken(requestEndpoint) {
  //Get the page token
  var tokenUrl = requestEndpoint+"?fields=access_token";
  var tokenResponse = UrlFetchApp.fetch(tokenUrl,
      {
        headers: { 'Authorization': 'Bearer ' + getOAuthService().getAccessToken() },
        muteHttpExceptions : true
      });
  var pageToken = JSON.parse(tokenResponse).access_token;
  return pageToken;
}

function getData(request) {

  var requestedFields = request.fields.map(function(field) {
    return field.name;
  });
  console.log("Requested field : ",requestedFields)


  //Extract info from request
  var pageId = request.configParams['page_id'];
  var startDate = request.dateRange.startDate;
  var endDate = request.dateRange.endDate;

  var requestEndpoint = "https://graph.facebook.com/v5.0/"+pageId+"/"


  //create de schema for the data
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
  //Get the page token
  var pageToken = getToken(requestEndpoint);

  //Some metrics need particular queries
  const indexPostLink = requestedFields.indexOf("post_link");
  const indexPostDate = requestedFields.indexOf("post_date");
  const indexPostMessage = requestedFields.indexOf("post_message");
  const indexPostImpressions = requestedFields.indexOf("post_impressions");
  const indexPostEngagements = requestedFields.indexOf("post_engagements");

  if (indexPostLink>-1 && indexPostDate>-1 && indexPostImpressions>-1 && indexPostEngagements>-1 && indexPostMessage>-1) {
    // we are requesting information about posts
    var response = getPostFromAPI(startDate,endDate,pageToken,requestEndpoint);

  }
  else if (requestedFields.indexOf("post_number")>-1) {
    // we are requesting information about posts
    var response = getPostNumber(startDate,endDate,pageToken,requestEndpoint);
  }
  else {

  //Get data from API
  var response = getAllDataFromAPI(requestedFields,startDate,endDate,pageToken,requestEndpoint);

  }

  console.log("Response :",response);
  var data = [];
  response.forEach(function(days) {
    var values = [];



    dataSchema.forEach(function(field) {
      switch (field.name) {
      case 'page_fan_adds':
        values.push(days.page_fan_adds);
        break;
      case 'page_views_total':
        values.push(days.page_views_total);
        break;
      case 'page_fans':
        values.push(days.page_fans);
        break;
      case 'page_posts_impressions':
        values.push(days.page_posts_impressions);
        break;
      case 'page_post_engagements':
        values.push(days.page_post_engagements);
        break;
      case 'page_posts_impressions_organic':
        values.push(days.page_posts_impressions_organic);
        break;
      case 'page_posts_impressions_paid':
        values.push(days.page_posts_impressions_paid);
        break;
      case 'post_number':
        values.push(days.post_number);
        break;
      case 'male_gender':
        values.push(days.male_gender);
        break;
      case 'female_gender':
        values.push(days.female_gender);
        break;
      case 'unknown_gender':
        values.push(days.unknown_gender);
        break;
      case 'post_impressions':
        values.push(days.post_impressions);
        break;
      case 'post_engagements':
        values.push(days.post_engagements);
        break;
      case 'day':
        values.push(days.date);
        break;
      case 'post_date':
        values.push(days.post_date);
        break;
      case 'post_link':
        values.push(days.post_link);
        break;
      case 'post_message':
        values.push(days.post_message);
        break;

      }
    });
    console.log(values);
    data.push({
      values: values
    });
  });


  console.log(data);
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
//ref : https://stickler.de/informationen/data-analytics/kostenloser-facebook-ads-google-datastudio-connector
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
    .setTokenUrl('https://graph.facebook.com/v6.0/oauth/access_token')
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
