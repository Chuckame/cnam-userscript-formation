// ==UserScript==
// @name         CNAM Formation Helper
// @version      0.1
// @description  Permet de sélectionner et voir les UE choisies, ainsi que les restantes
// @author       Chuckame
// @homepage     https://github.com/Chuckame/cnam-userscript-formation
// @match        http://formation.cnam.fr/*
// @require      http://rawgit.com/notifyjs/notifyjs/master/dist/notify.js
// ==/UserScript==

(function() {
    'use strict';

    $('body').append('<script type="text/javascript" src="https://rawgit.com/notifyjs/notifyjs/master/dist/notify.js"></script>');

    var checked = new Set();
    var taken = new Set();
    var fulled = new Set();
    var checkedColor = '#7fd867';
    var takenColor = '#ff8b8b';
    var fulledColor = '#62ceff';
    var defaultColor = '#efefef';

    function getCodeOfUeDiv(div){
        if (!($(div).is('div') && $(div).hasClass('ue'))){
            return;
        }
        return $(div).find('div.code > a[target="ue"]').html();
    }
    function getCreditsOfUeDiv(div){
        if (!($(div).is('div') && $(div).hasClass('ue'))){
            return;
        }
        return parseInt($(div).find('div.credits')[0].innerText.match(/.*(\d+)\s+ect.*/i)[1]);
    }
    function getCreditsOfSectionDiv(div){
        if (!($(div).is('div') && $(div).hasClass('suite'))){
            return;
        }
        return parseInt($(div).find('span.credits-equivalents').first()[0].innerText.match(/.*\s+(\d+)\s+ect.*/i)[1]);
    }
    function computeUsedCreditsOfSectionDiv(div){
        if (!($(div).is('div') && $(div).hasClass('suite'))){
            return;
        }
        var result = 0;
        $(div).find('div.ue').each(function (){
            if (checked.has(this)){
                result += getCreditsOfUeDiv(this);
            }
        });
        return result;
    }
    function getSectionDivFromUeDiv(div){
        if (!($(div).is('div') && $(div).hasClass('ue'))){
            return;
        }
        return $(div).parent('div.suite');
    }
    function getSimilarsUeFromCode(code){
        var result = new Set();
        $('div.ue').each(function (){
            if (getCodeOfUeDiv(this) === code){
                result.add(this);
            }
        });
        return result;
    }
    function resetUeDiv(div){
        checked.delete(div);
        taken.delete(div);
        fulled.delete(div);
        $(div).css('background-color', defaultColor);
    }
    function checkUeDiv(div){
        checked.add(div);
        $(div).css('background-color', checkedColor);
    }
    function takeUeDiv(div){
        taken.add(div);
        $(div).css('background-color', takenColor);
    }
    function fullUeDiv(div){
        fulled.add(div);
        $(div).css('background-color', fulledColor);
    }
    function refreshSection(section){
        var requiredCredits = getCreditsOfSectionDiv(section);
        console.log('Crédits requis pour cette section:', requiredCredits);
        var restantCredits = requiredCredits - computeUsedCreditsOfSectionDiv(section);
        console.log('Crédits restants pour cette section:', restantCredits);
        $(section).find('div.ue').each(function (){
            if (checked.has(this) || taken.has(this)){
                return;
            }
            var credits = getCreditsOfUeDiv(this);
            console.log("Crédits de l'UE", getCodeOfUeDiv(this), ':', credits);
            if (credits > restantCredits){
                fullUeDiv(this);
            }else{
                resetUeDiv(this);
            }
        });
    }

    $('div.ue').click(function(event){

        if ($(event.target).hasClass('cra_opener') || $(event.target).is('a')){
            return;
        }

        var div = event.currentTarget;
        var code = getCodeOfUeDiv(div);

        if (fulled.has(div)){
            $.notify('warn', "Cette section d'UE(s) est complète.");
        } else if (checked.has(div)){
            resetUeDiv(div);
            getSimilarsUeFromCode(code).forEach(function(similar){
                if (taken.has(similar)){
                    resetUeDiv(similar);
                    refreshSection(getSectionDivFromUeDiv(similar));
                }
            });
        } else if (taken.has(div)){
            $.notify('error', 'Cette UE est déjà prise.');
        } else{
            checkUeDiv(div);
            getSimilarsUeFromCode(code).forEach(function(similar){
                if (similar !== div){
                    takeUeDiv(similar);
                    refreshSection(getSectionDivFromUeDiv(similar));
                }
            });
        }
        refreshSection(getSectionDivFromUeDiv(div));
    });
})();