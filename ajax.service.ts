import { Injectable, EventEmitter, Inject } from '@angular/core';
import { Http, Headers, RequestOptions, RequestOptionsArgs, Response, RequestMethod, Request, Connection, ConnectionBackend } from '@angular/http';
import * as Rx from 'rxjs';
import { RequestParams } from "app/models";
import { CommonService } from "./common.service";
import { BrowserKeys } from "app/core/constant/common.constant";
import { Router } from "@angular/router";
import { BuildingAPIPath } from 'app/core/constant/api.constant';

export enum Action { QueryStart, QueryStop };

@Injectable()
export class AjaxHttp {
    process: EventEmitter<any> = new EventEmitter<any>();
    authFailed: EventEmitter<any> = new EventEmitter<any>();
    isIE: boolean;
    notGiveResponse = true; //true;


    constructor(private _http: Http, private commonService: CommonService, private route: Router) {
        this.hasIE();
    }

    private hasIE() {
        let trident = !!navigator.userAgent.match(/Trident\/7.0/);
        let net = !!navigator.userAgent.match(/.NET4.0E/);
        let IE11 = trident && net;
        let IEold = (navigator.userAgent.match(/MSIE/i) ? true : false);
        this.isIE = IE11 || IEold;
    }

    private _buildAuthHeader(): string {
        return 'Bearer ' + this.commonService.getLocalStorageString(BrowserKeys.token);
    }

    public get(url: string, options?: RequestOptionsArgs, extraParams?: RequestParams): Rx.Observable<Response> {
        if (url.includes(BuildingAPIPath.building)) {
            this.notGiveResponse = false;
        }
        return this._request(RequestMethod.Get, url, null, options, extraParams);
    }

    public post(url: string, body: any, options?: RequestOptionsArgs, extraParams?: RequestParams): Rx.Observable<Response> {
        return this._request(RequestMethod.Post, url, body, options, extraParams);
    }

    public put(url: string, body: any, options?: RequestOptionsArgs, extraParams?: RequestParams): Rx.Observable<Response> {
        return this._request(RequestMethod.Put, url, body, options, extraParams);
    }

    public delete(url: string, options?: RequestOptionsArgs, extraParams?: RequestParams): Rx.Observable<Response> {
        return this._request(RequestMethod.Delete, url, null, options, extraParams);
    }

    public patch(url: string, body: any, options?: RequestOptionsArgs, extraParams?: RequestParams): Rx.Observable<Response> {
        if (!extraParams) {
            extraParams = new RequestParams();
        }
        extraParams.type = 'application/merge-patch+json';
        return this._request(RequestMethod.Patch, url, body, options, extraParams);
    }

    public options(url: string, options?: RequestOptionsArgs, extraParams?: RequestParams): Rx.Observable<Response> {
        return this._request(RequestMethod.Options, url, null, options, extraParams);
    }

    public head(url: string, options?: RequestOptionsArgs, extraParams?: RequestParams): Rx.Observable<Response> {
        return this._request(RequestMethod.Head, url, null, options, extraParams);
    }

    private _request(method: RequestMethod, url: string, body?: any, options?: RequestOptionsArgs, params?: RequestParams): Rx.Observable<Response> {

        let requestOptions = new RequestOptions(Object.assign({
            method: method,
            url: url,
            body: body
        }, options));

        if (!requestOptions.headers) {
            requestOptions.headers = new Headers();
        }

        if (params && params.type) {
            requestOptions.headers.set("Content-Type", params.type)
        }

        if (!params || !params.removeAuthToken) {
            requestOptions.headers.set("Authorization", this._buildAuthHeader())
        }

        if (this.isIE) {
            requestOptions.headers.set("Cache-Control", 'no-cache');
            requestOptions.headers.set("Pragma", 'no-cache');
            requestOptions.headers.set("Expires", 'Sat, 01 Jan 2000 00:00:00 GMT');
        }

        return Rx.Observable.create((observer) => {
            this.process.next(Action.QueryStart);
            this._http.request(new Request(requestOptions))
                .map(res => {
                    if (params && params.responseHeader) {
                        return {
                            header: {
                                totalCount: +res.headers.get('X-Total-Count')
                            },
                            data: res.text() ? res.json() : {}
                        }
                    }
                    return res.text() ? res.json() : {};
                })
                .finally(() => {
                    this.process.next(Action.QueryStop);
                })
                .subscribe(
                (res) => {
                    observer.next(res);
                    observer.complete();
                },
                (err) => {

                    switch (err.status) {
                        case 403:
                            //intercept 401
                            this.route.navigateByUrl('/public/login');
                            observer.error(err);
                            break;
                        case 404:
                            if (!this.notGiveResponse) {
                                observer.error(err);
                            } else {
                                this.route.navigate(['secure', 'error', err.status]);
                            }
                            break;
                        case 503:
                            this.route.navigate(['secure', 'error', err.status]);
                            break;
                        case 500:
                            this.route.navigate(['secure', 'error', err.status]);
                            break;
                        // case 400:
                        //     this.route.navigate(['secure', 'error', err.status]);
                        //     break;
                        case 401:
                            this.route.navigate(['secure', 'error', err.status]);
                            break;
                        default:
                            observer.error(err);
                            break;
                    }
                })
        })
    }

}
