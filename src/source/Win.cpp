//*****************************************************************************
// File: Win.cpp
//*****************************************************************************

#include "stdafx.h"
#include "Win.h"
#include "Input.h"
#include "Button.h"

CWin::CWin() : m_psprBg(NULL), m_fScaleX(1.0f), m_fScaleY(1.0f)
{
}

CWin::~CWin()
{
    Release();
}

void CWin::Create(int nWidth, int nHeight, int nTexID, bool bTile)
{
    Release();

    m_fScaleX = (float)WindowWidth / 800.0f;
    m_fScaleY = (float)WindowHeight / 600.0f;

    if (-2 < nTexID)
    {
        m_psprBg = new CSprite;
        m_psprBg->Create(nWidth, nHeight, nTexID, 0, NULL, 0, 0, bTile,
            SPR_SIZING_DATUMS_LT, m_fScaleX, m_fScaleY);
        if (-1 == nTexID)
        {
            m_psprBg->SetAlpha(128);
            m_psprBg->SetColor(0, 0, 0);
        }
    }

    m_ptPos.x = m_ptPos.y = 0;
    m_ptHeld = m_ptTemp = m_ptPos;
    m_Size.cx = nWidth;
    m_Size.cy = nHeight;
    m_bDocking = m_bActive = m_bShow = false;
    m_nState = WS_NORMAL;
}

void CWin::Release()
{
    PreRelease();

    CButton* pBtn;
    while (m_BtnList.GetCount())
    {
        pBtn = (CButton*)m_BtnList.RemoveHead();
        pBtn->Release();
    }

    SAFE_DELETE(m_psprBg);
}

void CWin::SetPosition(int nXCoord, int nYCoord)
{
    m_ptPos.x = nXCoord;
    m_ptPos.y = nYCoord;
    if (m_psprBg)
        m_psprBg->SetPosition(nXCoord, nYCoord);
}

void CWin::SetSize(int nWidth, int nHeight, CHANGE_PRAM eChangedPram)
{
    if (eChangedPram & X)
        m_Size.cx = nWidth;
    if (eChangedPram & Y)
        m_Size.cy = nHeight;

    if (m_psprBg)
        m_psprBg->SetSize(nWidth, nHeight, eChangedPram);
}

bool CWin::CursorInWin(int nArea)
{
    if (!m_bShow)
        return false;

    CInput& rInput = CInput::Instance();
    RECT rc = { 0, 0, 0, 0 };
    NODE* position;
    CButton* pBtn;

    switch (nArea)
    {
    case WA_ALL:
        ::SetRect(&rc,
            (int)(m_ptPos.x * m_fScaleX),
            (int)(m_ptPos.y * m_fScaleY),
            (int)((m_ptPos.x + m_Size.cx) * m_fScaleX),
            (int)((m_ptPos.y + m_Size.cy) * m_fScaleY));
        if (::PtInRect(&rc, rInput.GetCursorPos()))
            return true;
        break;

    case WA_MOVE:
        ::SetRect(&rc,
            (int)(m_ptPos.x * m_fScaleX),
            (int)(m_ptPos.y * m_fScaleY),
            (int)((m_ptPos.x + m_Size.cx) * m_fScaleX),
            (int)((m_ptPos.y + 26) * m_fScaleY));
        if (::PtInRect(&rc, rInput.GetCursorPos()))
            return true;
        break;
    case WA_BUTTON:
        position = m_BtnList.GetHeadPosition();
        while (position)
        {
            pBtn = (CButton*)m_BtnList.GetNext(position);
            if (pBtn->CursorInObject())
                return true;
        }
        if (CursorInButtonlike())
            return true;
        break;
    }

    return false;
}

void CWin::ActiveBtns(bool bActive)
{
    CButton* pBtn;
    NODE* position = m_BtnList.GetHeadPosition();
    while (position)
    {
        pBtn = (CButton*)m_BtnList.GetNext(position);
        pBtn->SetActive(bActive);
    }
}

void CWin::Show(bool bShow)
{
    if (m_psprBg)
        m_psprBg->Show(bShow);
    m_bShow = bShow;
    if (!m_bShow)
        m_bActive = false;
}

void CWin::Update(double dDeltaTick)
{
    if (!m_bShow)
        return;

    CInput& rInput = CInput::Instance();

    if (rInput.IsLBtnUp())
        m_nState = WS_NORMAL;

    if (m_nState == WS_NORMAL)
    {
        CButton* pBtn;
        NODE* position = m_BtnList.GetHeadPosition();
        while (position)
        {
            pBtn = (CButton*)m_BtnList.GetNext(position);
            pBtn->Update();
        }
    }

    UpdateWhileShow(dDeltaTick);

    if (!m_bActive)
        return;

    if (rInput.IsLBtnDn())
    {
        if (CursorInWin(WA_MOVE))
        {
            m_ptHeld = rInput.GetCursorPos();
            m_ptTemp = m_ptPos;
            m_nState = WS_MOVE;
        }
    }

    if (WS_MOVE == m_nState)
    {
        int dx = rInput.GetCursorX() - m_ptHeld.x;
        int dy = rInput.GetCursorY() - m_ptHeld.y;
        m_ptTemp.x += (int)(dx / m_fScaleX);
        m_ptTemp.y += (int)(dy / m_fScaleY);
        if (!m_bDocking)
            SetPosition(m_ptTemp.x, m_ptTemp.y);
        m_ptHeld = rInput.GetCursorPos();
    }
    CheckAdditionalState();
    UpdateWhileActive(dDeltaTick);
}

void CWin::Render()
{
    if (m_bShow)
    {
        if (m_psprBg)
            m_psprBg->Render();

        RenderControls();
    }
}

void CWin::RegisterButton(CButton* pBtn)
{
    m_BtnList.AddTail(pBtn);
}

void CWin::RenderButtons()
{
    CButton* pBtn;
    NODE* position = m_BtnList.GetHeadPosition();
    while (position)
    {
        pBtn = (CButton*)m_BtnList.GetNext(position);
        pBtn->Render();
    }
}