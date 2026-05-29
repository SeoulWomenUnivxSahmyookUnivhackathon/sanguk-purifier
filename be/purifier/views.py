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