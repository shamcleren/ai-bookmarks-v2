// A deliberately flawed module — tests if clean-code-guard catches AI failure modes

import { fetch, Request } from 'some-lib'; // Rule 17: unverified import

// Rule 1: bad names
let data: any;

// Rule 14: no present-day caller, Rule 4: boolean flag
function processData(data2: any, useV2: boolean, enableLogging: boolean, forceRefresh: boolean, mode: string): any {
  // Rule 15: broad catch-all
  try {
    // Rule 2: function too long, Rule 3: too many params
    const result = [];
    for (let i = 0; i < data2.length; i++) {
      // step 1: validate
      if (!data2[i]) continue;
      // step 2: transform
      const item = data2[i].value;
      // step 3: filter
      if (item > 0) {
        // step 4: format
        const formatted = { name: item.toString(), score: item * 2 };
        result.push(formatted);
      }
    }
    // Rule 16: defensive null check on internal return
    if (result === null || result === undefined) return [];
    // Rule 18: hardcoded success
    return { status: 'ok', data: result };
  } catch (e) {
    // Rule 15: swallowing error
    console.log('error happened');
    return { status: 'ok', data: [] }; // Rule 18 again
  }
}

// Rule 5: comment explains what, not why
// This function calculates the total score
function calculateTotalScore(scores: number[]): number {
  // loop through each score
  let total = 0;
  for (let i = 0; i < scores.length; i++) {
    // add score to total
    total = total + scores[i]; // Rule 1: temp variable name
  }
  // return the total
  return total;
}

// Rule 10: abstraction lives with implementation, not client
export class Manager {
  // Rule 7: multiple actors in one class
  private items: any[] = [];
  
  addItem(item: any) { this.items.push(item); }
  
  // Auth concern mixed with data concern
  validateUser(token: string) { return token.length > 0; }
  
  // Reporting concern
  generateReport() { return this.items.map(i => ({ name: i.name })); }
  
  // Rule 9: LSP violation — subclass would refuse
  // Rule 14: no caller for export
  exportToCSV() { throw new Error('Not implemented'); }
}

