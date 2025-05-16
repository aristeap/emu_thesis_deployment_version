import * as angular from 'angular';

class DragnDropDataService{
	private convertedBundles;
	private sessionDefault;
	private $q;
	
	constructor($q){
		this.$q = $q;
		this.convertedBundles = [];
		this.sessionDefault = '';
	}
	
	///////////////////////////////
	// public api
	
	public getBundle(name) {
		//  console.log("drag-n-drop-data.service.ts-> getBundle(name)");
		var bc;
		var defer = this.$q.defer();
		this.convertedBundles.forEach((bundle) => {
			if (bundle.name === name) {
				// console.log("Bundle before copying:", bundle);
				// console.log("Prototype of bundle:", Object.getPrototypeOf(bundle));
	
				//console.log("angular.copy(bundle):", angular.copy(bundle));

				 bc = angular.copy(bundle);
				// console.log("Bundle after copying:", bc);
	
				delete bc.name;
				defer.resolve({
					status: 200,
					data: bc
				});
			}
		});
		// console.log("this.convertedBundles: ",this.convertedBundles);
		// console.log("bc ----------- ",bc);
		// console.log("defer.promise",defer.promise);

		return defer.promise;
	};
	
	//New function for the fetched files
	public addConvertedBundle(bundle) {
		// Optionally check for duplicates before adding
		const exists = this.convertedBundles.some(b => b.name === bundle.name && b.session === bundle.session);
		if (!exists) {
		  this.convertedBundles.push(bundle);
		  // Optionally, you can also set the default session if needed:
		  if (!this.sessionDefault) {
			this.sessionDefault = bundle.name;
		  }
		  console.log("Added converted bundle:", bundle);
		} else {
		  console.log("Converted bundle already exists for:", bundle.name);
		}
	}
	  
	
	public resetToInitState() {
		this.convertedBundles = [];
		this.sessionDefault = '';
	};
	
	public setDefaultSession(name) {
		this.sessionDefault = name;
	};
	
	public getDefaultSession() {
		return this.sessionDefault;
	};

	// NEW: processFetchedBundle() will inject a fetched bundle into the conversion chain.
	public processFetchedBundle(bundle) {
		// console.log("processFetchedBundle called with bundle:", bundle);
		// Insert the fetched bundle into the convertedBundles array.
		this.convertedBundles.push(bundle);
		
		// Optionally update the session default if not already set.
		if (!this.sessionDefault) {
			this.sessionDefault = bundle.name;
		}
		
		// console.log("Fetched bundle processed and added. Current convertedBundles:", this.convertedBundles);
		// Optionally broadcast an event or call further processing here.
	}
	
	
}

angular.module('emuwebApp')
.service('DragnDropDataService', ['$q', DragnDropDataService]);
