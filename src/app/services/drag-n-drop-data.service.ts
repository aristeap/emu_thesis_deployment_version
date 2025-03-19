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
		// console.log("drag-n-drop-data.service.ts-> getBundle(name)");
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
	
}

angular.module('emuwebApp')
.service('DragnDropDataService', ['$q', DragnDropDataService]);
