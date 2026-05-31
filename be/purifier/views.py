from django.shortcuts import render, get_object_or_404, redirect
from .models import PurificationRecord, PurificationMode
from .services import purify_text

def get_or_create_session(request):
    if not request.session.session_key:
        request.session.create()
    return request.session.session_key

def index(request):
    modes = PurificationMode.choices
    return render(request, 'purifier/index.html', {'modes': modes})

def create(request):
    if request.method == 'POST':
        original = request.POST.get('original_text', '').strip()
        mode     = request.POST.get('mode', 'scholar')
        session_key = get_or_create_session(request)

        if original:
            result = purify_text(original, mode)
            PurificationRecord.objects.create(
                session_key    = session_key,
                original_text  = original,
                purified_text  = result['purified_text'],
                mode           = mode,
                severity_score = result['severity_score'],
            )
    return redirect('record_list')

def record_list(request):
    session_key = get_or_create_session(request)
    mode_filter = request.GET.get('mode', '')
    sort_by     = request.GET.get('sort', '-created_at')

    records = PurificationRecord.objects.filter(session_key=session_key)
    if mode_filter:
        records = records.filter(mode=mode_filter)
    if sort_by in ['severity_score', '-severity_score', 'created_at', '-created_at']:
        records = records.order_by(sort_by)

    return render(request, 'purifier/list.html', {
        'records': records,
        'modes':   PurificationMode.choices,
        'current_mode': mode_filter,
    })

def update(request, pk):
    session_key = get_or_create_session(request)
    record = get_object_or_404(PurificationRecord, pk=pk, session_key=session_key)

    if request.method == 'POST':
        original = request.POST.get('original_text', '').strip()
        mode     = request.POST.get('mode', record.mode)

        if original:
            result = purify_text(original, mode)
            record.original_text  = original
            record.purified_text  = result['purified_text']
            record.mode           = mode
            record.severity_score = result['severity_score']
            record.save()
        return redirect('record_list')

    return render(request, 'purifier/update.html', {
        'record': record,
        'modes':  PurificationMode.choices,
    })

def delete(request, pk):
    session_key = get_or_create_session(request)
    record = get_object_or_404(PurificationRecord, pk=pk, session_key=session_key)
    if request.method == 'POST':
        record.delete()
    return redirect('record_list')


# ============================================================
# REST API용 JSON 뷰 및 직렬화 유틸리티
# ============================================================

import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods

def serialize_record(record):
    return {
        'id': record.id,
        'original_text': record.original_text,
        'purified_text': record.purified_text,
        'mode': record.mode,
        'severity_score': record.severity_score,
        'created_at': record.created_at.isoformat(),
        'updated_at': record.updated_at.isoformat(),
    }

from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
@require_http_methods(["GET", "POST"])
def api_records(request):
    session_key = get_or_create_session(request)
    
    if request.method == 'GET':
        mode_filter = request.GET.get('mode', '')
        sort_by     = request.GET.get('sort', '-created_at')
        
        records = PurificationRecord.objects.filter(session_key=session_key)
        if mode_filter:
            records = records.filter(mode=mode_filter)
            
        valid_sorts = ['severity_score', '-severity_score', 'created_at', '-created_at']
        if sort_by in valid_sorts:
            records = records.order_by(sort_by)
        else:
            records = records.order_by('-created_at')
            
        results = [serialize_record(r) for r in records]
        return JsonResponse({'count': len(results), 'results': results})
        
    elif request.method == 'POST':
        try:
            body = json.loads(request.body)
            original = body.get('original_text', '').strip()
            mode     = body.get('mode', 'scholar')
            
            if not original:
                return JsonResponse({'detail': '원문을 입력해 주세요.'}, status=400)
                
            result = purify_text(original, mode)
            record = PurificationRecord.objects.create(
                session_key    = session_key,
                original_text  = original,
                purified_text  = result['purified_text'],
                mode           = mode,
                severity_score = result['severity_score'],
            )
            return JsonResponse(serialize_record(record), status=201)
        except json.JSONDecodeError:
            return JsonResponse({'detail': '잘못된 JSON 형식입니다.'}, status=400)
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=500)

@require_http_methods(["PUT", "PATCH", "DELETE"])
def api_record_detail(request, pk):
    session_key = get_or_create_session(request)
    record = get_object_or_404(PurificationRecord, pk=pk, session_key=session_key)
    
    if request.method == 'DELETE':
        record.delete()
        return HttpResponse(status=204)
        
    elif request.method in ['PUT', 'PATCH']:
        try:
            body = json.loads(request.body)
            original = body.get('original_text', '').strip()
            mode     = body.get('mode', record.mode)
            
            if request.method == 'PATCH' and 'original_text' not in body:
                original = record.original_text
                
            if not original:
                return JsonResponse({'detail': '원문을 입력해 주세요.'}, status=400)
                
            if original != record.original_text or mode != record.mode:
                result = purify_text(original, mode)
                record.original_text  = original
                record.purified_text  = result['purified_text']
                record.mode           = mode
                record.severity_score = result['severity_score']
            else:
                if 'mode' in body:
                    record.mode = mode
                    
            record.save()
            return JsonResponse(serialize_record(record))
        except json.JSONDecodeError:
            return JsonResponse({'detail': '잘못된 JSON 형식입니다.'}, status=400)
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=500)
