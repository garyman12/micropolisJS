/* micropolisJS. Adapted from Micropolis by Graeme McCutcheon.
 *
 * This code is released under the GNU GPL v3, with some additional terms.
 * Please see the files LICENSE and COPYING for details. Alternatively,
 * consult http://micropolisjs.graememcc.co.uk/LICENSE and
 * http://micropolisjs.graememcc.co.uk/COPYING
 *
 */

define(['Messages', 'MiscUtils', 'ModalWindow'],
       function(Messages, MiscUtils, ModalWindow) {
  "use strict";

  var BudgetWindow = ModalWindow(function() {
    $(budgetCancelID).on('click', cancel.bind(this));
    $(budgetResetID).on('click', resetItems.bind(this));
    $(budgetFormID).on('submit', submit.bind(this));
  });


  var dataKeys = ['roadFund', 'fireFund', 'policeFund'];
  var spendKeys = ['roadRate', 'fireRate', 'policeRate'];

  var budgetResetID = '#budgetReset';
  var budgetCancelID = '#budgetCancel';
  var budgetFormID = '#budgetForm';
  var budgetOKID = '#budgetOK';


  var setSpendRangeText = function(element, percentage, totalSpend) {
    var labelID = element + 'Label';
    var cash = Math.floor(totalSpend * (percentage / 100));
    var text = [percentage, '% of $', totalSpend, ' = $', cash].join('');
    $(MiscUtils.normaliseDOMid(labelID)).text(text);
  };


  var onFundingUpdate = function(elementID, e) {
    var element = $(MiscUtils.normaliseDOMid(elementID))[0];
    var percentage = element.value - 0;
    var dataSource = element.getAttribute('data-source');
    setSpendRangeText(elementID, percentage, this[dataSource]);
  };


  var onTaxUpdate = function(e) {
    var elem = $('#taxRateLabel')[0];
    var sourceElem = $('#taxRate')[0];
    $(elem).text(['Tax rate: ', sourceElem.value, '%'].join(''));
  };


  var resetItems = function(e) {
    for (var i = 0; i < spendKeys.length; i++) {
      var original = this['original' + spendKeys[i]];
      $(MiscUtils.normaliseDOMid(spendKeys[i]))[0].value = original;
      setSpendRangeText(spendKeys[i], original, this[dataKeys[i]]);
    }
    $('#taxRate')[0].value = this.originaltaxRate;
    onTaxUpdate();

    e.preventDefault();
  };


  BudgetWindow.prototype.close = function(data) {
    data = data || {cancelled: true};
    this._emitEvent(Messages.BUDGET_WINDOW_CLOSED, data);
    this._toggleDisplay();
  };


  var cancel = function(e) {
    e.preventDefault();
    this.close({cancelled: true});
  };


  var submit = function(e) {
    e.preventDefault();

    // Get element values
    var roadPercent = $('#roadRate')[0].value;
    var firePercent = $('#fireRate')[0].value;
    var policePercent = $('#policeRate')[0].value;
    var taxPercent = $('#taxRate')[0].value;

    var data = {cancelled: false, roadPercent: roadPercent, firePercent: firePercent,
                          policePercent: policePercent, taxPercent: taxPercent, e: e, original: e.type};
    this.close(data);
  };


  BudgetWindow.prototype.open = function(budgetData) {
    var i, elem;

    // Store max funding levels
    for (i = 0; i < dataKeys.length; i++) {
      if (budgetData[dataKeys[i]] === undefined)
        throw new Error('Missing budget data');
      this[dataKeys[i]] = budgetData[dataKeys[i]];
    }

    // Update form elements with percentages, and set up listeners
    for (i = 0; i < spendKeys.length; i++) {
      if (budgetData[spendKeys[i]] === undefined)
        throw new Error('Missing budget data');

      elem = spendKeys[i];
      this['original' + elem] = budgetData[elem];
      setSpendRangeText(elem, budgetData[spendKeys[i]], this[dataKeys[i]]);
      elem = $(MiscUtils.normaliseDOMid(elem));
      elem.on('input', onFundingUpdate.bind(this, spendKeys[i]));
      elem = elem[0];
      elem.value = budgetData[spendKeys[i]];
    }

    if (budgetData.taxRate === undefined)
      throw new Error('Missing budget data');

    this.originalTaxRate = budgetData.taxRate;
    elem = $('#taxRate');
    elem.on('input', onTaxUpdate);
    elem = elem[0];
    elem.value = budgetData.taxRate;
    onTaxUpdate();

    // Update static parts
    var previousFunds = budgetData.totalFunds;
    if (previousFunds === undefined)
      throw new Error('Missing budget data');

    var taxesCollected = budgetData.taxesCollected;
    if (taxesCollected === undefined)
      throw new Error('Missing budget data');

    var cashFlow = taxesCollected - this.roadFund - this.fireFund - this.policeFund;
    var currentFunds = previousFunds + cashFlow;
    $('#taxesCollected').text('$' + taxesCollected);
    $('#cashFlow').text((cashFlow < 0 ? '-$' : '$') + cashFlow);
    $('#previousFunds').text((previousFunds < 0 ? '-$' : '$') + previousFunds);
    $('#currentFunds').text('$' + currentFunds);

    this._toggleDisplay();
  };


  return BudgetWindow;
});
