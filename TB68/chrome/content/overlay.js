function InjectionGED()
{
    //Lecture des variables de l'injection mail dans la registry
    
				    //Windows Registry Editor Version 5.00
						//[HKEY_LOCAL_MACHINE\SOFTWARE\Ged\Mail]
						//"folderInjectionCourrier"="c:\\\\temp\\\\courrier"
						//"folderInjectionClientFolder"="c:\\\\temp\\\\ClientFolder"
						//"programmeIndexation"="C:\\\\temp\\\\make_xml.bat"
		    var wrk = Components.classes["@mozilla.org/windows-registry-key;1"].createInstance(Components.interfaces.nsIWindowsRegKey);
				wrk.open(wrk.ROOT_KEY_LOCAL_MACHINE,"SOFTWARE\\Ged\\Mail",wrk.ACCESS_READ);
				var folderInjectionCourrier = wrk.readStringValue("folderInjectionCourrier");
				var folderInjectionClientFolder = wrk.readStringValue("folderInjectionClientFolder");
				var programmeIndexation = wrk.readStringValue("programmeIndexation");
				wrk.close();
		
		//Creation des pointeurs et nom des futurs fichier .eml et .xml et du processus d'indexation
    
		    var timestamp=Math.round(new Date().getTime() / 512)
			var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
		    file.initWithPath(programmeIndexation);  // C'est un pointeur vers le programme d'indexation
		    var emlFile = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("TmpD", Components.interfaces.nsIFile); 
		    emlFile.append("mail"+timestamp+".eml");
		   	var xmlIndexesFile = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("TmpD", Components.interfaces.nsIFile);
				xmlIndexesFile.append("mail"+timestamp+".xml");

    //Creation et appel du processus d'indexation
    
		    var process = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
		    process.init(file);
		    var args = [xmlIndexesFile.path];  // On passe le nom du fichier xml en param au programme d'indexation
		    process.run(true, args, 1); //On appelle le prog d'indexation, on attend la fin du process 
		   	var exitCode=process.exitValue // On stocke le return code 0:ClientFolderOK 1:ClientFolderKO 2:courrierOK 3:courrierKO

    //Copie du contenu du mail dans le fichier .eml
    	
	    	try {// On ecrit dans le fichier eml le contenu du mail choisi
		    	var content_frame = document.getElementById('content-frame');
		    	var MessageURI = gFolderDisplay.selectedMessage;
		    	IETwriteDataOnDisk(MessageURI,emlFile);
		    }
		    		catch(e) {
					alert("error\n" + e.name + ": " + e.message);
				}
		
		//Copie des fichiers .eml et .xml vers le repertoire lu par le job d'injection
		
				try {
					// Copie des fichiers vers \\datacl04\DATAVOL05\Import-GED\InjectionWord
					  var aDir = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
					  if (!aDir) return false;
					  //aDir.initWithPath("\\\\datacl04\\DATAVOL05\\Import-GED\\InjectionWord");
					  if (exitCode==0) {// Case of ClientFolder XML well ended
					  	aDir.initWithPath(folderInjectionClientFolder);
						  emlFile.copyTo(aDir,null);
						  xmlIndexesFile.copyTo(aDir,null);
					  }
					  else if (exitCode==1) {//Case of ClientFolder XML badly ended
					 	 alert(timestamp+"Erreur indexation ClientFolder :"+exitCode);
					  }
					  else if (exitCode==2) {//Case of courrier XML well ended
					  	aDir.initWithPath(folderInjectionCourrier);
						  emlFile.copyTo(aDir,null);
						  xmlIndexesFile.copyTo(aDir,null);
					  }
					  else if (exitCode==3) {//Case of courrier XML badly ended
					  	alert(timestamp+"Erreur indexation courrier :"+exitCode);
					  }
					  else {//Unknown case
					  	alert("return code non pris en charge, rien n'est fait");
					  }
					  
		    }
		    		catch(e) {
					alert("error copying files \n" + e.name + ": " + e.message);
				}
		
		//Fin du main du plugin
		
			if (exitCode==0 || exitCode==2) {
				alert("Le mail sera visible dans la GED d'ici 20 minutes environ");
			} else {
				alert("Problème lors de l'indexation du mail ou de l'injection des fichiers "+timestamp +" exitCode"+exitCode);
			}
				
}
	

function  IETwriteDataOnDisk(MessageURI, file) {
	
  var content = "";
  var uri = MessageURI.folder.getUriForMsg(MessageURI);
  var messenger = Components.classes["@mozilla.org/messenger;1"].createInstance(Components.interfaces.nsIMessenger); //BNO
  var MsgService = messenger.messageServiceFromURI(uri);
  var MsgStream =  Components.classes["@mozilla.org/network/sync-stream-listener;1"].createInstance();
  var consumer = MsgStream.QueryInterface(Components.interfaces.nsIInputStream);
  var ScriptInput = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance();
  var ScriptInputStream = ScriptInput.QueryInterface(Components.interfaces.nsIScriptableInputStream);
  ScriptInputStream.init(consumer);
  try {
    MsgService.streamMessage(uri, MsgStream, msgWindow, null, false, null);
  } catch (ex) {
    alert("error: "+ex)
  }
  ScriptInputStream .available();
  while (ScriptInputStream .available()) {
    content = content + ScriptInputStream .read(512);
  }
	var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
	foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0); // write, create, truncate
	if (content) {
		foStream.write(content,content.length);
	} else {
		alert("Attention, le fichier eml "+file.path+" semble vide, veuillez contacter votre méthodologie");
	}
			
	foStream.close();
}