from django.db import models

class PurificationMode(models.TextChoices):
    SCHOLAR   = 'scholar',   '선비 모드'
    TREND     = 'trend',     '어쩔티비 모드'
    CUTE      = 'cute',      '뿌잉뿌잉 모드'
    RANT      = 'rant',      '주접 모드'
    INTERVIEW = 'interview', '면접 모드'


class PurificationRecord(models.Model):
    session_key    = models.CharField(max_length=40, verbose_name='세션 키')
    original_text  = models.TextField(verbose_name='원본 텍스트')
    purified_text  = models.TextField(verbose_name='순화된 텍스트')
    mode           = models.CharField(
                         max_length=20,
                         choices=PurificationMode.choices,
                         default=PurificationMode.SCHOLAR,
                         verbose_name='순화 모드'
                     )
    severity_score = models.IntegerField(default=0, verbose_name='심각도 점수')
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = '순화 기록'

    def __str__(self):
        return f"[{self.mode}] {self.original_text[:20]}..."