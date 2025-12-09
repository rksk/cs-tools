$(document).ready(function(){
    $('#btnB64Encode').click(function (){base64encode();});
    $('#btnB64Decode').click(function (){base64decode();});
    $('#btnJwtDecode').click(function (){jwtDecode();});
    $('#btnUrlEncode').click(function (){urlEncode();});
    $('#btnUrlDecode').click(function (){urlDecode();});
    $('#btnJsonFormat').click(function (){jsonFormat();});
    $('#btnXmlFormat').click(function (){xmlFormat();});
    $('#btnSqlFormat').click(function (){sqlFormat();});
});

var zlib = require('zlib');

function base64encode(){
    get('preB64OutputCode').innerText = btoa(get('textAreaB64Input').value);
}

function base64decode(){
    var data = get('textAreaB64Input').value;
    var output="";
    try {
        data = atob(data);    
        if(isJson(data) == true){
            output= JSON.stringify(JSON.parse(data), null, 2);
        } else {
            output= data;
        }
        get('preB64OutputCode').innerText = output;
    } catch (error) {
        showError("Error: Invalid Base64 value");
    }
}

function jwtDecode(){
    try {
        var data = get('textAreaJwtInput').value;
        var output="";
        if(data.indexOf('.')!==-1){
            var arr = data.split('.');
            if(arr.length==3){
                output="Header\n";
                output += JSON.stringify(JSON.parse(atob(arr[0])), null, 2);
                output += "\n"
                output +="Payload\n";
                output += JSON.stringify(JSON.parse(atob(arr[1])), null, 2);
                output += "\n"
                output +="Signature\n";
                output += arr[2];
            }else{
                output= 'Invalid JWT';
            }
        } else {
            data = atob(data);
            if(isJson(data) == true){
                output= JSON.stringify(JSON.parse(data), null, 2);
            } else {
                output= data;
            }
        }
        get('preJwtOutputCode').innerText = output;
    } catch (error) {
        showError("Error: Invalid JWT value");
    }
}

function urlEncode(){
    get('preUrlOutputCode').innerText = encodeURIComponent(get('textAreaUrlInput').value).replace(
        /[!'()*]/g,
        (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
      );
}

function urlDecode(){
    try {
        get('preUrlOutputCode').innerText = decodeURIComponent(get('textAreaUrlInput').value);
    } catch (error) {
        showError("Error: Invalid URL Encoded value");
    }    
}

function jsonFormat(){
    try {
        get('preJsonOutputCode').innerText = JSON.stringify(JSON.parse(get('textAreaJsonInput').value), null, 2);
    } catch (error) {
        showError("Error: Invalid JSON Payload");
    }    
}

function xmlFormat(sourceXml){
    try{
        get('preXmlOutputCode').innerText = '';
        if(get('textAreaXmlInput').value.trim() != ''){
            var xml = new DOMParser().parseFromString(get('textAreaXmlInput').value, 'application/xml');
            var xslt = new DOMParser().parseFromString([
                '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
                '  <xsl:strip-space elements="*"/>',
                '  <xsl:template match="para[content-style][not(text())]">',
                '    <xsl:value-of select="normalize-space(.)"/>',
                '  </xsl:template>',
                '  <xsl:template match="node()|@*">',
                '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
                '  </xsl:template>',
                '  <xsl:output indent="yes"/>',
                '</xsl:stylesheet>',
            ].join('\n'), 'application/xml');

            var xsltProcessor = new XSLTProcessor();    
            xsltProcessor.importStylesheet(xslt);
            var result = xsltProcessor.transformToDocument(xml);
            var formattedXml = new XMLSerializer().serializeToString(result);
            get('preXmlOutputCode').innerText = formattedXml;
        }
    } catch (error) {
        showError("Error: Invalid XML Payload");
    }
};

function sqlFormat() {
    // try {
        get('preSqlOutputCode').innerText = '';
        const input = get('textAreaSqlInput').value;
        if (!input.trim()) {
            return;
        }

        // Keywords that should start on a new line
        const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'AS', 'CASE', 'WHEN', 'THEN', 'END', 'ELSE'];
        
        // Normalize whitespace to a single space
        let formattedSql = input.replace(/\s+/g, ' ').trim();
        
        // Replace main keywords with a newline and uppercase them
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            formattedSql = formattedSql.replace(regex, `\n${keyword.toUpperCase()}`);
        });
        
        // Add indentation for multiple WHERE conditions
        // formattedSql = formattedSql.replace(/(WHERE\s)(.*)/gi, (match, p1, p2) => {
        //     // Split the part after 'WHERE' by 'AND' or 'OR'
        //     const conditions = p2.split(/\b(AND|OR)\b/i);
        //     let result = p1 + conditions[0];
            
        //     // Add a newline and an indent for each subsequent condition
        //     for (let i = 1; i < conditions.length; i += 2) {
        //     result += `\n    ${conditions[i].toUpperCase()} ${conditions[i + 1].trim()}`;
        //     }
        //     return result;
        // });

        // Indent after commas, including in nested queries
        formattedSql = formattedSql.replace(/,\s*/g, ',\n  ');
        
        // Add a new line and indentation for nested FROM clauses
        formattedSql = formattedSql.replace(/\bFROM\s+\(/gi, (match) => {
            return `\nFROM (\n  `;
        });
        
        // Clean up extra spaces around parentheses and add new lines for better readability
        formattedSql = formattedSql.replace(/\)\s*(\S)/g, ') \n  $1');

        get('preSqlOutputCode').innerText = formattedSql.trim();
    // } catch (error) {
    //     showError("Error: Invalid SQL");
    // }
}

function get(id){
    return document.getElementById(id);
}

function getAll(cssClass){
    return document.getElementsByClassName(cssClass);
}

function showError(msg){
    get('alertMessage').innerHTML = msg;
    $('#errorModal').modal();
}

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}