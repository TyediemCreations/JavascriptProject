function g026(userid, htmlId) {
    "use strict";

    var templates = {};

    var model = {
    	checked : 0,
    	bio: {},
    	coursesD: {},
    	coursesAdded: [],
	buttonsAdded: [],
    	coursesCopy: {},
    	views: [],

    	requirementCopy : {}, 
    	requirement: {},

	mathSubjects: ["ACTSC", "AMATH", "CO", "COMM", "CS", "MATBUS", "MATH", "MTHEL", "PMATH"],

    	// Initialize this object
    	init: function () {
      	    console.log("initializing model");
      	    var that = this;

      	    // Initialize bio
      	    $.getJSON("https://cs349.student.cs.uwaterloo.ca:9410/api/v1/student/stdBio/" + userid,
        	function (d) {
         	console.log(JSON.stringify(d));
          	if (d.meta.status === "200 OK") {
            	    that.bio = d.result;
            	    that.updateViews("bio");
	    	    that.updateViews("controllers");
          	} else {
            	    that.updateViews("error");
          	}
        	}).fail(function( jqxhr, textStatus, error ) {
        	    var err = textStatus + ", " + error;
        	    console.log( "Request Failed: " + err );
        	}
	    );
	    
	    // Initialize coursesCopy
	    $.getJSON("https://cs349.student.cs.uwaterloo.ca:9410/api/v1/student/stdGrades/" + userid,
        	function (d) {
         	console.log(JSON.stringify(d));
          	if (d.meta.status === "200 OK") {
            	    that.coursesCopy = d.result;
          	} 
        	}).fail(function( jqxhr, textStatus, error ) {
        	    var err = textStatus + ", " + error;
        	    console.log( "Request Failed: " + err );
        	}
	    ); 
    	},

    	/**
     	* Add a new view to be notified when the model changes.
     	*/
    	addView: function (view) {
      	    this.views.push(view);
      	    view("");
    	},

    	/**
     	* Update all of the views that are observing us.
     	*/
    	updateViews: function (msg) {
     	    var i = 0;
      	    for (i = 0; i < this.views.length; i++) {
        	this.views[i](msg);
      	    }
    	},

	isMathCourse : function (subject){
	    var i=0;
	    for (i=0;i<this.mathSubjects.length;i++){
		if (this.mathSubjects[i] === subject) return true;
	    }
	    return false;
	},

	addedCoursesContains : function (subject, catalog){
	    var i=0;
	    for (i=0;i<this.coursesAdded.length;i++){
		if (this.coursesAdded[i].subjectCode === subject && this.coursesAdded[i].catalog === catalog){
		    return true;
		}
	    }
	    return false;
	},

	coursesContains : function (subject, catalog){
	    var i=0;
	    for (i=0;i<this.coursesCopy.courses.length;i++){
		if (this.coursesCopy.courses[i].subjectCode === subject && this.coursesCopy.courses[i].catalog === catalog && this.coursesCopy.courses[i].courseGrade !== "" && this.coursesCopy.courses[i].courseGrade !== "WD"){
		    return true;
		}
	    }
	    if (this.addedCoursesContains(subject, catalog)) return true;
	    return false;
	},

    	existsInPrereq : function(course, prereqs){
	    var i=0;
	    for (i=0;i<prereqs.length;i++){
		if (typeof prereqs[i] === 'number') {}
		else if (typeof prereqs[i] === 'string'){
			if (prereqs[i] === course) {return true;}
		}
		else{
			if (model.existsInPrereq(course, prereqs[i])) {return true;}
		} 
	    }
	    return false;
    	},

    	findPrerequisites: function (subjectCode, catalog, units){
	    var i=0;
	    var j=0;
	    var course = "";
	    model.requirement.depth[0].reqnum2 -= units;

	    var prereqs = new Array();
	
	    var that = this;
      
      	    $.getJSON("https://api.uwaterloo.ca/v2/courses/" + subjectCode + "/" + catalog + "/prerequisites.json?key=89660ae4dc888bbf1821c62d8eeb65a9",
        	function (d) {
          	    if (d.meta.status === 200) {
			if (typeof d.data.prerequisites_parsed === 'string') {}
            		else {
			    prereqs = d.data.prerequisites_parsed;
			    for (i=0;i<that.coursesD.courses.length;i++){

				course = that.coursesD.courses[i].subjectCode + that.coursesD.courses[i].catalog;
				if (that.existsInPrereq(course, prereqs)){
					that.findPrerequisites(that.coursesD.courses[i].subjectCode, that.coursesD.courses[i].catalog,that.coursesD.courses[i].unitsEarned);
				}
				else {
				}
			    }
			}	
          	    } 
	  	    else if (d.meta.status === 204){	//assumed to be a course without a prerequisite
			
	  	    }
	  	    else {
            		console.log("Failed to read course prerequisite data." + JSON.stringify(d.meta));
          	    }
	  	    //if (that.requirement.depth[0].reqnum2 <= 0) {}
	  	    //else {that.requirement.depth[0].reqnum2 += units;}
        	}
	    );
    	},

    	loadReqData: function () {
      	    var that = this;
      
      	    // Initialize courses
      	    $.getJSON("https://cs349.student.cs.uwaterloo.ca:9410/api/v1/student/stdGrades/" + userid,
        	function (d) {
          	that.coursesD = d.result;
	  	var i=0;
	  	for (i=0;i<that.coursesAdded.length;i++){
		    that.coursesD.courses.push(that.coursesAdded[i]);
	  	}

	  	that.requirement = {
		    unitsLeft : {
			totalLeft: 0,
			csLeft: 0,
			mathLeft: 0,
			nonmathLeft: 0,
			electiveLeft: 0
		    },
		    everything : [
  		    {subject:"CS", catalog:["115","135","145"]}, 
  		    {subject:"CS", catalog:["136", "146"]},
  		    {subject:"MATH", catalog:["127","137","147"]},
  		    {subject:"MATH", catalog:["128","138","148"]},
  		    {subject:"MATH", catalog:["135","136"]},
  		    {subject:"MATH", catalog:["136","146"]},
  		    {subject:"MATH", catalog:["239","249"]},
  		    {subject:"STAT", catalog:["230","240"]},
  		    {subject:"STAT", catalog:["231","241"]},
  		    {subject:"CS", catalog:["240"]},
  		    {subject:"CS", catalog:["241"]},
  		    {subject:"CS", catalog:["245"]},
  		    {subject:"CS", catalog:["246"]},
  		    {subject:"CS", catalog:["251"]},
  		    {subject:"CS", catalog:["341"]},
  		    {subject:"CS", catalog:["350"]}
    		    ],
		    additional : [{reqnum : 2, subject : "CS",reqmin : "440", reqmax : "489"}],
		    additional2 : [{reqnum: 3, subject : "CS",reqmin : "340", reqmax : "398", reqmin2 : "440", reqmax2 : "489"}],

		    additional3 : [
		    {description: "1 additional course chosen from: ", courses:[
		    {subject: "CO", catalog:["487"]},
		    {subject: "CS", catalog:["499T"]},	//cs 499T
		    {subject: "STAT", catalog:["440"]},
		    {subject: "CS", reqmin:"440",reqmax:"498",dashLine:"-"},	// 440-498
		    {subject: "CS", reqmin:"600",reqmax:"799",dashLine:"-"}]}
		    ],

		    additional4 : [
		    {description1:"At least one course from at least ", reqnum:2, description2: " of the following area groups:", courses:[
		    {subject:"CS",catalog: ["343","349","442","444","445","446","447","450","452","454","456","457","458"]}, 
		    {subject:"CS",catalog: ["348","448","449","473","476","482","483","484","485","486","488"]}, 
		    {subject:"CS",catalog: ["360","365","370","371","462","466","467","475","487"]}]}
		    ],
		    breadth: [{reqnum : 1, name: "Humanities", 
	subjects: ["ARTS","CHINA","CLAS","CMW","CROAT","DAC","DRAMA","DUTCH","EASIA","ENGL","FINE","FR","GER","GRK","HIST","HUMSC","ITAL","ITALST","JAPAN","JS","KOREA","LAT","MUSIC","PHIL","POLSH","PORT","REES","RS","RUSS","SI","SPAN","SPCOM"]
	}, {reqnum : 1, name : "Social Sciences",
	subjects: ["AFM","ANTH","APPLS","BUS","ECON","GEOG","HRM","INTST","INTTS","ISS","LS","MSCI","NATST","PACS","PSCI","PSYCH","REC","SMF","SOC","SOCWK","SPD","STV","MWS"]
 	}, {reqnum : 0.5, name : "Pure Sciences",
	subjects: ["BIOL","CHEM","EARTH","PHYS","SCI"]
	}, {reqnum : 0.5, name : "Pure and Applied Sciences",
	subjects: ["BIOL","CHEM","EARTH","PHYS","SCI","ARCH","ENVS","ERS","GERON","HLTH","KIN","PLAN"]
	}],
		    depth: [{reqnum1: 1.5, reqThirdYear: 0.5, description1: "units with the same subject, including at least", description2: "units at third-year level or higher or", reqnum2: 1.5, description3: "units with the same subject forming a prerequisite chain of length three"}],	
	
		    addedCourses : [],
		    counter : 0
		}

		that.requirement.addedCourses = that.coursesAdded;	  
	  	var j=0;
	  	var k=0;
	  	var l=0;
	  
	  	var Length1 = 0;
	  	var Length2 = 0;

		var csUnits = 7.5;
		var mathUnits = 3.5;
		var nonmathUnits = 5;
		var electiveUnits = 4;

	  	//removing failures, withdrawn courses and courses not yet taken
	  	for (i=0;i< that.coursesD.courses.length; i++){
		    if (that.checked === 1 && that.coursesD.courses[i].courseGrade === "") {
			if (that.addedCoursesContains(that.coursesD.courses[i].subjectCode, that.coursesD.courses[i].catalog)) {that.coursesD.courses.splice(i,1);i--;}
		    }
		    else if (that.coursesD.courses[i].courseGrade < "50" || that.coursesD.courses[i].courseGrade === "WD"){
 			that.coursesD.courses.splice(i,1);
			i--;
		    }
	  	}

		//additional requirements 4
	
		for (i=0;i<that.requirement.additional4[0].courses.length;i++){
		
		    Length1 = that.coursesD.courses.length;
		    for (j=0;j<Length1;j++){
			
			if (that.coursesD.courses[j].subjectCode === that.requirement.additional4[0].courses[i].subject){
			
			    Length2 = that.requirement.additional4[0].courses[i].catalog.length;
			    for (k=0;k<Length2;k++){
				if (that.coursesD.courses[j].catalog === that.requirement.additional4[0].courses[i].catalog[k]){
						
				    that.requirement.additional4[0].courses.splice(i,1);
				    i--;
				    k = Length2+1;
				    j = Length1+1;
				    that.requirement.additional4[0].reqnum--;
				    if (that.requirement.additional4[0].reqnum === 0) i =4;
						
				}
			    }
			
			}
			
		    }
	  	}
	  	if (that.requirement.additional4[0].reqnum <= 0) { //delete all elements of additional4
	  	    that.requirement.additional4.splice(0,1);
	  	}//end of additional requirements 4

	  	//'Core requirements'
	  	for (i=0;i<that.requirement.everything.length;i++){
		    Length1 = that.coursesD.courses.length;
		    for (j=0;j<Length1;j++){
			if (that.coursesD.courses[j].subjectCode === that.requirement.everything[i].subject){
			    Length2 = that.requirement.everything[i].catalog.length;
			    for (k=0;k<Length2;k++){
				if (that.coursesD.courses[j].catalog === that.requirement.everything[i].catalog[k]){

				    if (that.coursesD.courses[j].subjectCode === "CS") csUnits -= that.coursesD.courses[j].unitsEarned;
				    else mathUnits -= that.coursesD.courses[j].unitsEarned;

				    that.coursesD.courses.splice(j,1);
				    j--;
				    that.requirement.everything.splice(i,1);
				    i--;
				    k = Length2+1;
				    j = Length1+1;
				}
			    }
			}
		    }
	  	}//end of Core requirements

	  	//addition requirements
	  	for (i=0;i<that.coursesD.courses.length;i++){
		    if (that.coursesD.courses[i].subjectCode === that.requirement.additional[0].subject){
			if (that.coursesD.courses[i].catalog >= that.requirement.additional[0].reqmin && that.coursesD.courses[i].catalog <= that.requirement.additional[0].reqmax) {
			    that.requirement.additional[0].reqnum --;
			    csUnits -= that.coursesD.courses[i].unitsEarned;
			    that.coursesD.courses.splice(i,1);
			    i--;
			    if (that.requirement.additional[0].reqnum === 0){
				that.requirement.additional.splice(0,1);
				i = that.coursesD.courses.length +1;
			    }
			}
		    }
	  	}
	  
	  	//additional requirements 2
	  	var counter = 0;

		for (i=0;i<that.coursesD.courses.length;i++){
		    if (that.coursesD.courses[i].subjectCode === that.requirement.additional2[0].subject){
			if (that.coursesD.courses[i].catalog >= that.requirement.additional2[0].reqmin && that.coursesD.courses[i].catalog <= that.requirement.additional2[0].reqmax) {
			    that.requirement.additional2[0].reqnum --;
			    csUnits -= that.coursesD.courses[i].unitsEarned;
			    that.coursesD.courses.splice(i,1);
			    i--;
			    counter++;
			    if (that.requirement.additional2[0].reqnum === 0){
				that.requirement.additional2.splice(0,1);
				i = that.coursesD.courses.length +1;
			    }
			}
		    }
		}
	
		if (counter < 3){
		    for (i=0;i<that.coursesD.courses.length;i++){
			if (that.coursesD.courses[i].subjectCode === that.requirement.additional2[0].subject){
			    if (that.coursesD.courses[i].catalog >= that.requirement.additional2[0].reqmin2 && that.coursesD.courses[i].catalog <= that.requirement.additional2[0].reqmax2) {
				that.requirement.additional2[0].reqnum --;
				csUnits -= that.coursesD.courses[i].unitsEarned;
				that.coursesD.courses.splice(i,1);
				i--;
				counter++;
				
				if (that.requirement.additional2[0].reqnum === 0){
				    that.requirement.additional2.splice(0,1);
				    i = that.coursesD.courses.length +1;
				}
			    }
			}
	  	    }
		}//end of additional requirements 2
	
		//additional requirements 3
		///*
		counter = 0;
		for (i=0;i<3;i++){
		    Length1 = that.coursesD.courses.length;
		    for (j=0;j<Length1;j++){
			if (that.coursesD.courses[j].subjectCode === that.requirement.additional3[0].courses[i].subject){
			    Length2 = that.requirement.additional3[0].courses[i].catalog.length;
			    for (k=0;k<Length2;k++){
				if (that.coursesD.courses[j].catalog === that.requirement.additional3[0].courses[i].catalog[k]){
				    csUnits -= that.coursesD.courses[j].unitsEarned;
				    that.coursesD.courses.splice(j,1);

				    counter++;
				    k = Length2+1;
				    j = Length1+1;
				    i = 4;
				}
			    }
			}
		    }
		}
		if (counter === 1){}
		else {
		    for (i=3;i<5;i++){
			Length1 = that.coursesD.courses.length;
			for (j=0;j<Length1;j++){
			    if (that.coursesD.courses[j].subjectCode === that.requirement.additional3[0].courses[i].subject){
				if (that.coursesD.courses[j].catalog >= that.requirement.additional3[0].courses[i].reqmin && that.coursesD.courses[j].catalog <= that.requirement.additional3[0].courses[i].reqmax){
				    
				    csUnits -= that.coursesD.courses[j].unitsEarned;
				    that.coursesD.courses.splice(j,1);

				    counter++;
				    k = Length2+1;
				    j = Length1+1;
				    i = 6;
				}
			    }
			}
		    }
		}
		if (counter > 0){
		    that.requirement.additional3.splice(0,1);
		} 
		//*///end of additional requirements 3

		//depth requirements
		for (i=0;i<that.coursesD.courses.length;i++){
		    that.requirement.depth[0].reqnum1 = 1.5;	////NOTE: reqnum1 = 1.5
		    that.requirement.depth[0].reqThirdYear = 0.5;
		    that.requirement.depth[0].reqnum1 -= that.coursesD.courses[i].unitsEarned;
		    if (that.coursesD.courses[i].catalog >= "300"){
			that.requirement.depth[0].reqThirdYear -= that.coursesD.courses[i].unitsEarned;
		    }

		    for (j=0;j<that.coursesD.courses.length;j++){
			if (i !== j && that.coursesD.courses[i].subjectCode === that.coursesD.courses[j].subjectCode){	//ADD: ... && that.coursesD.course[i].subjectCode !=== a math course
			    that.requirement.depth[0].reqnum1 -= that.coursesD.courses[j].unitsEarned;
			    if (that.coursesD.courses[j].catalog >= "300"){
				that.requirement.depth[0].reqThirdYear -= that.coursesD.courses[j].unitsEarned;
			    }
			    if (that.requirement.depth[0].reqnum1 <= 0 && that.requirement.depth[0].reqThirdYear <= 0){
				i = that.coursesD.courses.length;
				j = that.coursesD.courses.length;
			    }
			}		
		    }
		}// three courses of the same name with at least one course in third year requirement
		if (that.requirement.depth[0].reqnum1 <=0 && that.requirement.depth[0].reqThirdYear <= 0){
		    that.requirement.depth.splice(0,1);
		}
		else{
		    that.requirement.depth[0].reqnum1 = 1.5;
		    that.requirement.depth[0].reqThirdYear = 0.5;
		    /*
		    for (i=0;i<that.coursesD.courses.length;i++){
			that.requirement.depth[0].reqnum2 = 1.5;
			that.findPrerequisites(that.coursesD.courses[i].subjectCode, that.coursesD.courses[i].catalog, that.coursesD.courses[i].unitsEarned);
			if (that.requirement.depth[0].reqnum2 <= 0){
			    that.requirement.depth.splice(0,1);
			    i = that.coursesD.courses.length;
			}
		    }
		
		    //*/
		} 

		//end of depth requirements

		//breadth requirements
		for (i=0;i<that.requirement.breadth.length;i++){
		    for (j=0;j<that.coursesD.courses.length;j++){
			Length2 = that.requirement.breadth[i].subjects.length;
		 	for (k=0;k<Length2;k++){
			    if (that.requirement.breadth[i].subjects[k] === that.coursesD.courses[j].subjectCode){
				that.requirement.breadth[i].reqnum -= that.coursesD.courses[j].unitsEarned;
				nonmathUnits -= that.coursesD.courses[j].unitsEarned;
				//console.log(nonmathUnits+" was the number of nonmath Units\nGiven:"+that.coursesD.courses[j].subjectCode + that.coursesD.courses[j].catalog);
				
				that.coursesD.courses.splice(j,1);
				j--;
				k = Length2;
				if (that.requirement.breadth[i].reqnum <= 0){
				    that.requirement.breadth.splice(i,1);
				    i--;
				    j = that.coursesD.courses.length;
				}
			    }
			}
		    }
		}
		//end of breadth

		//final course unit tally
		for (i=0;i<that.coursesD.courses.length;i++){
		    if (that.isMathCourse(that.coursesD.courses[i].subjectCode)) {
			electiveUnits -= that.coursesD.courses[i].unitsEarned;
		    }
		    else{
			if (nonmathUnits > 0) nonmathUnits -= that.coursesD.courses[i].unitsEarned;
			else electiveUnits -= that.coursesD.courses[i].unitsEarned;
		    }
		}

		

		that.requirement.unitsLeft.csLeft = csUnits;
		that.requirement.unitsLeft.mathLeft = mathUnits;
		that.requirement.unitsLeft.nonmathLeft = nonmathUnits;
		that.requirement.unitsLeft.electiveLeft = electiveUnits;

		that.requirement.unitsLeft.totalLeft = csUnits + mathUnits + nonmathUnits + electiveUnits;

		if (that.requirement.unitsLeft.csLeft < 0) that.requirement.unitsLeft.csLeft = 0;
		if (that.requirement.unitsLeft.mathLeft < 0) that.requirement.unitsLeft.mathLeft = 0;
		if (that.requirement.unitsLeft.nonmathLeft < 0) that.requirement.unitsLeft.nonmathLeft = 0;
		if (that.requirement.unitsLeft.electiveLeft < 0) that.requirement.unitsLeft.electiveLeft = 0;
		if (that.requirement.unitsLeft.totalLeft < 0) that.requirement.unitsLeft.totalLeft = 0;

		//end of final course unit tally
	  

         	that.updateViews("requirement");
            	}).fail(function( jqxhr, textStatus, error ) {
        	    var err = textStatus + ", " + error;
        	    console.log( "Request Failed: " + err );
            	}
	   );
    	}

    };

    var bioView = {

    	updateView: function (msg) {
      	    console.log("bioView.updateView with msg = " + msg + " bio = " + JSON.stringify(model.bio));
      	    if (msg === "bio") {
                var name = Mustache.render(templates.bio, model);
                $("#g026_bio").html(name);
      	    } else if (msg === "error") {
            	$("#g026_bio").html("Error loading web service data");
      	    }
    	},

    	// Initialize this object
    	init: function () {
      	    console.log("initializing bio view");
    	}
    };


    var requirementView = {
        updateView: function (msg) {
      	    var t = "";
      	    if (msg === "requirement") {
            	t = Mustache.render(templates.requirement, model.requirement);
      	    }
            $("#g026_cDescr").html(t);
    	},

    	// Initialize this object
    	init: function () {
      	    console.log("initializing requirementView");

       	    model.loadReqData();
//*
      	    $("#g026_courseInclude").click(function () {
                console.log("Include? checked");
	        if (model.checked === 0) model.checked = 1;
	        else model.checked = 0;
                model.loadReqData();
	    });

      	    $("#g026_add").click(function () {
        	var subject = $("#g026_addSubject").val();
		subject = subject.trim();
		subject = subject.toUpperCase();
        	var catalog = $("#g026_addCatalog").val();
		catalog = catalog.trim();
		var i=0;
        	console.log("Add clicked: " + subject + " " + catalog);
		
		if (model.coursesContains(subject, catalog)){}
		else {
		$.getJSON("https://api.uwaterloo.ca/v2/courses/" + subject + "/" + catalog + ".json?key=89660ae4dc888bbf1821c62d8eeb65a9",
        	    function (d) {
          	    	if (d.meta.status === 200) {
	    	    	    model.coursesAdded.push({subjectCode: subject, catalog: catalog, unitsEarned: d.data.units, courseGrade: 100});
	    	    	    model.loadReqData();
           	    	} else {
            	    	    
          	    	}

        	    }
		);
		}
        	$("#g026_addSubject").val("");
        	$("#g026_addCatalog").val("");
	
///*
		
			 
		
		
//*/
		
      	    });
	    
	   
	    

	    //$("#g026_rm0").click(function () {
        	//console.log("Button was clicked");

      	    //});

      	    $("#g026_rm").click(function () {
        	var subject = $("#g026_rmSubject").val();
        	var catalog = $("#g026_rmCatalog").val();
		subject = subject.trim();
		catalog = catalog.trim();

        	console.log("Remove clicked: " + subject + " " + catalog);
	
		var i=0;
		for (i=0;i<model.coursesAdded.length;i++){
		    if (model.coursesAdded[i].subjectCode === subject.toUpperCase() && model.coursesAdded[i].catalog === catalog){
			model.coursesAdded.splice(i,1);
			i = model.coursesAdded.length;
			model.loadReqData();
		    }
		}	

        	$("#g026_rmSubject").val("");
        	$("#g026_rmCatalog").val("");

      	    });

      

      	    $("#g026_reset").click(function () { 
        	console.log("Go clicked: Reset");
		model.coursesAdded.splice(0,model.coursesAdded.length);
		model.loadReqData();
	
      	    });
//*/
      	    model.addView(requirementView.updateView);
    	}
    };


    // Initialization
    console.log("Initializing g026(" + userid + ", " + htmlId + ")");
    portal.loadTemplates("widgets/g026/templates.json",
    	function (t) {
      	    templates = t;
      	    $(htmlId).html('<H1 id="g026_bio"></H1><DIV id="g026_coursesAdded"></DIV><DIV id="g026_requirement"></DIV>'+templates.baseHtml);

      	    model.init();
      	    bioView.init();
      	    
      	    requirementView.init();

      	    model.addView(bioView.updateView);
      	}
    );
}
