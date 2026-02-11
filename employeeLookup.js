import { LightningElement, api, wire } from 'lwc';
import { gql, graphql } from 'lightning/uiGraphQLApi';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

import NAME_FIELD from '@salesforce/schema/Employee__c.Name';
import BRANCH_FIELD from '@salesforce/schema/Employee__c.Branch__c';
import ROLE_FIELD from '@salesforce/schema/Employee__c.Role__c';

const EMPLOYEE_BY_EMPLOYEE_ID = gql`
  query EmployeeByEmployeeId($empId: String) {
    uiapi {
      query {
        Employee__c(where: { Employee_ID__c: { eq: $empId } }, first: 1) {
          edges {
            node { Id }
          }
        }
      }
    }
  }
`;

export default class EmployeeLookup extends LightningElement {
    @api employeeId;

    loading = true;
    recordId;
    lastEmittedRecordId; // prevents duplicate emits

    @wire(graphql, {
        query: EMPLOYEE_BY_EMPLOYEE_ID,
        variables: '$variables'
    })
    wiredIdLookup({ data, error }) {
        this.loading = true;
        this.recordId = undefined;
        this.lastEmittedRecordId = undefined;

        if (error) {
            this.emitResult('ERROR', { message: 'Lookup query failed. Check object/field access.' });
            return;
        }

        const edges = data?.uiapi?.query?.Employee__c?.edges || [];
        const id = edges[0]?.node?.Id;

        if (!id) {
            this.emitResult('NOT_FOUND', { message: `No employee found for ID: ${this.employeeId}` });
            return;
        }

        // triggers getRecord wire
        this.recordId = id;
    }

    @wire(getRecord, {
        recordId: '$recordId',
        fields: [NAME_FIELD, BRANCH_FIELD, ROLE_FIELD]
    })
    wiredEmployee({ data, error }) {
        if (!this.recordId) return;

        if (error) {
            this.emitResult('ERROR', { message: 'Employee fields could not be loaded. Check field-level security.' });
            return;
        }

        if (data) {
            // guard against emitting twice
            if (this.lastEmittedRecordId === this.recordId) return;
            this.lastEmittedRecordId = this.recordId;

            const employee = {
                name: getFieldValue(data, NAME_FIELD),
                branch: getFieldValue(data, BRANCH_FIELD),
                role: getFieldValue(data, ROLE_FIELD)
            };

            this.emitResult('FOUND', { recordId: this.recordId, employee });
        }
    }

    get variables() {
        return { empId: this.employeeId };
    }

    emitResult(status, payload = {}) {
        this.loading = false;

        this.dispatchEvent(
            new CustomEvent('lookupresult', {
                detail: { status, ...payload }
            })
        );
    }
}
